import {
  loadPortalState, readBoundedBody, PortalError, submissionSettings,
  type PortalEnv, type PortalState,
} from "./portal.js";
import { renderRequestEmail } from "./request-email.js";

const reply = (data: unknown, status = 200) => Response.json(data, {
  status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
});
const fail = (message: string): never => { throw new PortalError(400, message); };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
function string(value: unknown, max: number, required = true, singleLine = false): string {
  if (typeof value !== "string" || value.length > max || (required && !value.trim()) ||
      (singleLine && /[\r\n\0]/.test(value))) fail("Bitte Pflichtfelder und Textlängen prüfen.");
  return (value as string).trim();
}
function fieldValues(raw: unknown, form: PortalState["forms"][number]) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) fail("Ungültige Formularfelder.");
  const values = raw as Record<string, unknown>;
  const fields = form.type === "guide" ? [] : form.fields;
  if (Object.keys(values).some(key => !fields.some(field => field.id === key)))
    fail("Das Formular hat sich geändert. Bitte die Seite neu laden und die Felder prüfen.");
  return fields.map(field => {
    const value = values[field.id] ?? (field.type === "multiselect" ? [] : "");
    if (field.type === "multiselect") {
      if (!Array.isArray(value)) return fail("Ungültige Mehrfachauswahl.");
      if (value.length > field.options.length ||
          value.some(v => typeof v !== "string" || !field.options.includes(v)) ||
          new Set(value).size !== value.length || (field.required && !value.length))
        fail("Bitte die Auswahl für „" + field.label + "“ prüfen.");
      return { label: field.label, value: value.join(", ") };
    }
    const result = string(value, field.type === "textarea" ? 5000 : 1000, field.required);
    if (result && field.type === "select" && !field.options.includes(result))
      fail("Ungültige Auswahl für „" + field.label + "“.");
    if (result && field.type === "email" && (!emailPattern.test(result) || result.length > 254))
      fail("Bitte eine gültige E-Mail-Adresse eintragen.");
    if (result && field.type === "date") {
      const date = new Date(result + "T00:00:00Z");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(date.valueOf()) ||
          date.toISOString().slice(0, 10) !== result) fail("Bitte ein gültiges Datum eintragen.");
    }
    return { label: field.label, value: result };
  });
}
function fileType(bytes: Uint8Array): string | null {
  if (bytes.length >= 24 && [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v) &&
      new TextDecoder().decode(bytes.slice(12,16)) === "IHDR") return "image/png";
  if (bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0,4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8,12)) === "WEBP") return "image/webp";
  if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (bytes.length >= 5 && new TextDecoder().decode(bytes.slice(0,5)) === "%PDF-") return "application/pdf";
  return null;
}
function base64(bytes: Uint8Array) {
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += 8192)
    parts.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
  return btoa(parts.join(""));
}
async function attachments(data: FormData, allowed: boolean) {
  const files = data.getAll("files");
  if (files.length > 3 || (!allowed && files.length)) fail("Für dieses Anliegen sind diese Anhänge nicht erlaubt.");
  let size = 0;
  const result: Array<{ filename: string; content: string; content_type: string }> = [];
  for (const item of files) {
    if (!(item instanceof File) || item.size === 0) fail("Bitte gültige Dateien auswählen.");
    size += (item as File).size;
    if (size > 10 * 1024 * 1024) throw new PortalError(413, "Die Anhänge dürfen zusammen höchstens 10 MB groß sein.");
    const file = item as File, bytes = new Uint8Array(await file.arrayBuffer());
    const type = fileType(bytes);
    const extensions: Record<string, string[]> = {
      "image/png": ["png"], "image/jpeg": ["jpg", "jpeg"], "image/webp": ["webp"], "application/pdf": ["pdf"],
    };
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!type || type !== file.type || !extensions[type].includes(extension))
      fail("Dateiname, Dateityp und Dateiinhalt müssen zu JPG, PNG, WebP oder PDF passen.");
    const filename = file.name.replace(/[\x00-\x1f\x7f/\\]/g, "_").slice(-180);
    result.push({ filename, content: base64(bytes), content_type: type! });
  }
  return result;
}
async function verifyChallenge(token: string, ip: string, env: PortalEnv, requestId: string) {
  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY!, response: token, remoteip: ip,
    idempotency_key: requestId,
  });
  let response: Response;
  try {
    response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body, signal: AbortSignal.timeout(10000),
    });
  } catch { throw new PortalError(503, "Die Sicherheitsprüfung ist gerade nicht erreichbar. Bitte erneut versuchen."); }
  if (!response.ok) throw new PortalError(503, "Die Sicherheitsprüfung ist gerade nicht erreichbar.");
  const result = await response.json() as { success?: boolean; hostname?: string; action?: string };
  if (!result.success || result.hostname !== env.PUBLIC_HOSTNAME || result.action !== "service-request")
    fail("Bitte die Sicherheitsprüfung erneut durchführen.");
}

export async function handleSubmission(request: Request, env: PortalEnv): Promise<Response> {
  try {
    if (request.method !== "POST") return reply({ error: "Bitte das Formular zum Senden verwenden." }, 405);
    if (!submissionSettings(env).enabled) return reply({ error: "Der E-Mail-Versand wird noch eingerichtet. Bitte später erneut versuchen." }, 503);
    const url = new URL(request.url);
    if (request.headers.get("origin") !== url.origin ||
        (request.headers.get("sec-fetch-site") && request.headers.get("sec-fetch-site") !== "same-origin"))
      return reply({ error: "Diese Anfrage ist nicht erlaubt." }, 403);
    const ip = request.headers.get("cf-connecting-ip");
    if (!ip) return reply({ error: "Die Sicherheitsprüfung ist nicht verfügbar." }, 503);
    if (!(await env.REQUEST_RATE_LIMITER!.limit({ key: "service-request:" + ip })).success)
      return reply({ error: "Zu viele Versuche. Bitte warte eine Minute und versuche es erneut." }, 429);
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.startsWith("multipart/form-data;")) throw new PortalError(415, "Ungültiges Anfrageformat.");
    const bytes = await readBoundedBody(request, 11 * 1024 * 1024);
    let data: FormData;
    try { data = await new Response(bytes, { headers: { "content-type": contentType } }).formData(); }
    catch { fail("Das Formular konnte nicht gelesen werden."); }
    if (data!.get("website")) fail("Diese Anfrage konnte nicht bestätigt werden.");
    const requestId = string(data!.get("requestId"), 36);
    if (!uuidPattern.test(requestId)) fail("Ungültige Anfragekennung.");
    const formId = string(data!.get("formId"), 100);
    const state = await loadPortalState(env);
    const form = state.forms.find(f => f.id === formId && f.published);
    const area = state.areas.find(a => a.id === form?.area && a.published);
    if (!form || !area) throw new PortalError(404, "Dieses Anliegen ist nicht mehr veröffentlicht.");
    const name = string(data!.get("name") ?? "", 100, form!.type === "form", true);
    const email = string(data!.get("email"), 254, true, true);
    if (!emailPattern.test(email)) fail("Bitte eine gültige E-Mail-Adresse eintragen.");
    const subject = string(data!.get("subject"), 300, true, true);
    const message = string(data!.get("message"), 5000);
    let rawFields: unknown;
    try { rawFields = JSON.parse(string(data!.get("fields"), 100000)); }
    catch { fail("Ungültige Formularfelder."); }
    const fields = fieldValues(rawFields, form!);
    const files = await attachments(data!, form!.type === "form" && form!.upload);
    const recipient = env.MAIL_TEST_TO || area!.email;
    if (!emailPattern.test(recipient)) throw new PortalError(503, "Der Empfänger ist noch nicht eingerichtet.");
    const reference = "SP-" + requestId.slice(0, 8).toUpperCase() + "-" + requestId.slice(9, 13).toUpperCase();
    const mailSubject = "[" + reference + "] " + area!.name.replace(/[\r\n]/g, " ") + ": " + subject;
    const legacyText = [
        "Serviceportal – neue Anfrage", "Vorgangsnummer: " + reference,
        "Bereich: " + area!.name, "Anliegen: " + form!.title,
        "Art: " + (form!.type === "guide" ? "Rückfrage zur Anleitung" : "Formular"),
        "Name: " + (name || "nicht angegeben"), "E-Mail: " + email, "Betreff: " + subject, "",
        ...fields.map(field => field.label + ": " + (field.value || "–")),
        "", "Nachricht:", message, "",
        files.length ? "Anhänge: " + files.map(f => f.filename).join(", ") : "Keine Anhänge.",
      ].join("\n");
    // The fingerprint is based on user input, not mutable recipient/form labels.
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",
      new TextEncoder().encode(JSON.stringify({ formId, name, email, subject, message, fields: rawFields, files })),
    ))).map(x => x.toString(16).padStart(2, "0")).join("");
    const receipt = await env.DB.prepare("SELECT digest, status, created_at, mail_template_version FROM submission_receipts WHERE request_id = ?")
      .bind(requestId).first<{ digest: string; status: string; created_at: number; mail_template_version: number }>();
    if (receipt && receipt.digest !== digest)
      throw new PortalError(409, "Diese Anfragekennung wurde bereits mit anderen Angaben verwendet. Bitte dieselben Angaben erneut versuchen oder für eine neue Anfrage die Seite neu laden.");
    if (receipt?.status === "sent") return reply({ reference, accepted: true });
    if (receipt && receipt.created_at < Math.floor(Date.now() / 1000) - 23 * 3600)
      throw new PortalError(409, "Der frühere Versandstatus ist nicht mehr sicher prüfbar. Bitte die Anfrage nicht erneut senden und den Empfänger kontaktieren.");
    const challenge = string(data!.get("turnstileToken"), 2048);
    await verifyChallenge(challenge, ip!, env, requestId);
    let templateVersion = receipt?.mail_template_version ?? 2;
    const inserted = await env.DB.prepare(
      "INSERT OR IGNORE INTO submission_receipts (request_id, digest, status, created_at, mail_template_version) VALUES (?, ?, 'pending', ?, 2)",
    ).bind(requestId, digest, Math.floor(Date.now() / 1000)).run();
    if (inserted.meta.changes !== 1) {
      const competing = await env.DB.prepare("SELECT digest, status, mail_template_version FROM submission_receipts WHERE request_id = ?")
        .bind(requestId).first<{ digest: string; status: string; mail_template_version: number }>();
      if (!competing || competing.digest !== digest) throw new PortalError(409, "Diese Anfragekennung wird bereits verwendet.");
      if (competing.status === "sent") return reply({ reference, accepted: true });
      templateVersion = competing.mail_template_version;
    }
    if (![1, 2].includes(templateVersion)) throw new PortalError(503, "Die E-Mail-Vorlage ist gerade nicht verfügbar. Bitte später erneut versuchen.");
    const formatted = templateVersion === 2 ? renderRequestEmail({
      reference, area: area!.name, concern: form!.title, guide: form!.type === "guide",
      name, email, subject, replySubject: mailSubject, message, fields, files,
    }) : {};
    const payload = {
      from: env.RESEND_FROM!, to: [recipient], reply_to: email, subject: mailSubject,
      text: legacyText,
      ...formatted,
      ...(files.length ? { attachments: files } : {}),
    };
    let response: Response;
    try {
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json", "Idempotency-Key": "serviceportal/" + requestId },
        body: JSON.stringify(payload), signal: AbortSignal.timeout(20000),
      });
    } catch {
      throw new PortalError(503, "Der Versand konnte nicht bestätigt werden. Bitte mit denselben Angaben erneut versuchen.");
    }
    if (!response.ok) {
      console.error("Mail provider rejected request", response.status);
      throw new PortalError(503, "Der Versanddienst konnte die Anfrage nicht bestätigen. Deine Eingaben bleiben erhalten. Bitte erneut versuchen.");
    }
    const result = await response.json() as { id?: string };
    if (typeof result.id !== "string" || !result.id) throw new PortalError(503, "Der Versand konnte nicht bestätigt werden. Bitte erneut versuchen.");
    await env.DB.prepare("UPDATE submission_receipts SET status = 'sent', provider_id = ? WHERE request_id = ? AND digest = ?")
      .bind(result.id, requestId, digest).run();
    return reply({ reference, accepted: true });
  } catch (error) {
    if (error instanceof PortalError) return reply({ error: error.message }, error.status);
    console.error("Mail submission failed");
    return reply({ error: "Der Versand konnte nicht bestätigt werden. Deine Eingaben bleiben erhalten. Bitte erneut versuchen." }, 503);
  }
}

export async function cleanupSubmissionReceipts(env: PortalEnv) {
  if (env.PORTAL_MODE === "persistent")
    await env.DB.prepare("DELETE FROM submission_receipts WHERE created_at < ?")
      .bind(Math.floor(Date.now() / 1000) - 7 * 86400).run();
}
