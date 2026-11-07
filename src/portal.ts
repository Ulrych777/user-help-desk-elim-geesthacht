import { adminIdentity, type AccessEnv } from "./access.js";

export interface PortalEnv extends AccessEnv {
  DB: D1Database;
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  PORTAL_MODE?: string;
  MAIL_ENABLED?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  MAIL_TEST_TO?: string;
  PUBLIC_HOSTNAME?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  REQUEST_RATE_LIMITER?: RateLimit;
}
type Category = { id: string; name: string };
type Image = { type: "library"; id: string } | { type: "stored"; src: string; name: string } | null;
type Area = { id: string; name: string; description: string; email: string; icon: string; image: Image; published: boolean; categories: Category[] };
type Field = { id: string; label: string; type: string; required: boolean; options: string[] };
type GuideImage = { id: string; src: string; alt: string; caption: string; afterParagraph: number };
type Concern = { id: string; area: string; title: string; description: string; type: string; keywords: string; categories: string[]; upload: boolean; published: boolean; fields: Field[]; guideText: string; guideImages: GuideImage[] };
export type PortalState = { areas: Area[]; forms: Concern[] };
export class PortalError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const fail = (message: string): never => { throw new PortalError(400, message); };
const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : fail("Ungültige Daten.");
const text = (v: unknown, max: number, required = true): string =>
  typeof v === "string" && v.length <= max && (!required || v.trim().length > 0) ? v : fail("Bitte Textlängen und Pflichtfelder prüfen.");
const bool = (v: unknown): boolean => typeof v === "boolean" ? v : fail("Ungültiger Veröffentlichungszustand.");
const list = (v: unknown, max: number): unknown[] => Array.isArray(v) && v.length <= max ? v : fail("Zu viele oder ungültige Einträge.");
const id = (v: unknown): string => {
  const s = text(v, 100);
  return /^[A-Za-z0-9_-]+$/.test(s) ? s : fail("Ungültige Kennung.");
};
const unique = (values: string[]) => { if (new Set(values).size !== values.length) fail("Kennungen oder Namen sind doppelt."); };
const mediaKeyPattern = /^[a-f0-9-]{36}\.(png|webp|jpg)$/;
const storedSource = (v: unknown): string => {
  const s = text(v, 200);
  return s.startsWith("/media/") && mediaKeyPattern.test(s.slice(7)) ? s : fail("Ungültige Bildreferenz.");
};
const librarySources = new Set(["wlan-einstellungen.svg", "bereich-it.webp", "bereich-haus.webp", "bereich-finanzen.webp", "service-eingang.webp", "hintergrund-pflanze.webp", "Elim_Logo_L_Mini_Marine.png"]);
function image(v: unknown): Image {
  if (v === null) return null;
  const o = record(v);
  if (o.type === "library" && ["it", "house", "finance"].includes(String(o.id)))
    return { type: "library", id: String(o.id) };
  if (o.type === "stored") return { type: "stored", src: storedSource(o.src), name: text(o.name, 200) };
  return fail("Bitte ein gültiges Bereichsbild auswählen.");
}

export function validatePortal(v: unknown): PortalState {
  const o = record(v);
  const areas = list(o.areas, 100).map(value => {
    const a = record(value);
    const categories = list(a.categories, 100).map(value => {
      const c = record(value); return { id: id(c.id), name: text(c.name, 100) };
    });
    unique(categories.map(c => c.id));
    unique(categories.map(c => c.name.trim().toLowerCase()));
    const email = text(a.email, 254);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Bitte eine gültige Empfängeradresse eintragen.");
    const result: Area = {
      id: id(a.id), name: text(a.name, 150), description: text(a.description, 2000),
      email, icon: text(a.icon, 30), image: image(a.image), published: bool(a.published), categories,
    };
    if (result.published && !result.image) fail("Veröffentlichte Bereiche benötigen ein Bild.");
    return result;
  });
  unique(areas.map(a => a.id));
  const forms = list(o.forms, 1000).map(value => {
    const f = record(value), area = areas.find(a => a.id === f.area);
    if (!area) fail("Der Bereich des Anliegens ist nicht vorhanden.");
    const categories = list(f.categories, 100).map(id);
    unique(categories);
    if (categories.some(c => !area!.categories.some(a => a.id === c))) fail("Kategorie gehört nicht zum Bereich.");
    if (!["form", "guide"].includes(String(f.type))) fail("Ungültige Anliegenart.");
    const fields = list(f.fields, 100).map(value => {
      const field = record(value), type = text(field.type, 30);
      if (!["text", "textarea", "email", "date", "select", "multiselect"].includes(type)) fail("Ungültiger Feldtyp.");
      const options = list(field.options, 100).map(v => text(v, 200));
      if (["select", "multiselect"].includes(type) && !options.length) fail("Auswahlfelder benötigen Werte.");
      return { id: id(field.id), type, label: text(field.label, 150), required: bool(field.required), options };
    });
    unique(fields.map(f => f.id));
    const guideImages = list(f.guideImages, 5).map(value => {
      const img = record(value), src = text(img.src, 200);
      if (!librarySources.has(src)) storedSource(src);
      if (!Number.isInteger(img.afterParagraph) || Number(img.afterParagraph) < 1 || Number(img.afterParagraph) > 1000)
        fail("Ungültige Bildposition.");
      return { id: id(img.id), src, alt: text(img.alt, 300), caption: text(img.caption, 300, false), afterParagraph: Number(img.afterParagraph) };
    });
    unique(guideImages.map(i => i.id));
    return {
      id: id(f.id), area: area!.id, type: String(f.type), title: text(f.title, 300),
      description: text(f.description, 2000), keywords: text(f.keywords, 2000, false),
      categories, upload: bool(f.upload), published: bool(f.published), fields,
      guideText: text(f.guideText, 20000, false), guideImages,
    };
  });
  unique(forms.map(f => f.id));
  return { areas, forms };
}

const json = (data: unknown, status = 200) => Response.json(data, {
  status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
});
async function load(env: PortalEnv) {
  const row = await env.DB.prepare("SELECT version, data_json FROM portal_content WHERE id = 'main'")
    .first<{ version: number; data_json: string }>();
  if (!row) throw new PortalError(503, "Die Portalverwaltung wird noch vorbereitet.");
  return { version: row.version, ...validatePortal(JSON.parse(row.data_json)) };
}
export { load as loadPortalState, body as readBoundedBody };
export function submissionSettings(env: PortalEnv) {
  return {
    enabled: !!(env.MAIL_ENABLED === "true" && env.RESEND_API_KEY && env.RESEND_FROM &&
      env.TURNSTILE_SECRET_KEY && env.TURNSTILE_SITE_KEY && env.REQUEST_RATE_LIMITER && env.PUBLIC_HOSTNAME),
    siteKey: env.TURNSTILE_SITE_KEY || "",
  };
}
function published(state: PortalState) {
  const areas = state.areas.filter(a => a.published).map(({ email: _email, ...area }) => area);
  const forms = state.forms.filter(f => f.published && areas.some(a => a.id === f.area));
  return { areas, forms };
}
async function body(request: Request, maximum: number): Promise<Uint8Array<ArrayBuffer>> {
  if (Number(request.headers.get("content-length")) > maximum) throw new PortalError(413, "Die Datei oder Anfrage ist zu groß.");
  const reader = request.body?.getReader();
  if (!reader) fail("Leere Anfrage.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const next = await reader!.read();
    if (next.done) break;
    size += next.value.length;
    if (size > maximum) { await reader!.cancel(); throw new PortalError(413, "Die Datei oder Anfrage ist zu groß."); }
    chunks.push(next.value);
  }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}
function imageType(bytes: Uint8Array): { type: string; extension: string } {
  if (bytes.length >= 24 && [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v) &&
      new TextDecoder().decode(bytes.slice(12,16)) === "IHDR") return { type: "image/png", extension: "png" };
  if (bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0,4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8,12)) === "WEBP") return { type: "image/webp", extension: "webp" };
  if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return { type: "image/jpeg", extension: "jpg" };
  throw new PortalError(400, "Nur gültige PNG-, WebP- oder JPEG-Bilder sind erlaubt.");
}
async function media(request: Request, env: PortalEnv, key: string, admin: boolean) {
  if (!mediaKeyPattern.test(key)) return json({ error: "Bild nicht gefunden." }, 404);
  if (!admin) {
    const state = published(await load(env));
    const src = "/media/" + key;
    if (!state.areas.some(a => a.image?.type === "stored" && a.image.src === src) &&
        !state.forms.some(f => f.guideImages.some(i => i.src === src)))
      return json({ error: "Bild nicht gefunden." }, 404);
  }
  const object = await env.MEDIA.get("portal/" + key);
  if (!object) return json({ error: "Bild nicht gefunden." }, 404);
  return new Response(request.method === "HEAD" ? null : object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType || "application/octet-stream",
      "cache-control": "private, no-store", "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; sandbox",
    },
  });
}

export async function handlePortal(request: Request, env: PortalEnv): Promise<Response | null> {
  const url = new URL(request.url), path = url.pathname;
  const isAdmin = path === "/admin" || path.startsWith("/admin/") ||
    path === "/api/admin" || path.startsWith("/api/admin/");
  if (!isAdmin && path !== "/api/portal" && !path.startsWith("/media/")) return null;
  try {
    let email: string | null = null;
    if (isAdmin) {
      email = await adminIdentity(request, env);
      if (!email) return json({ error: "Bitte mit einer freigegebenen Admin-Adresse anmelden." }, 401);
    }
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method) && isAdmin) {
      if (request.headers.get("origin") !== url.origin ||
          (request.headers.get("sec-fetch-site") && !["same-origin", "none"].includes(request.headers.get("sec-fetch-site")!)))
        return json({ error: "Diese Anfrage ist nicht erlaubt." }, 403);
    }
    if (path === "/api/portal" && request.method === "GET") {
      const state = await load(env);
      return json({ version: state.version, ...published(state), submission: submissionSettings(env) });
    }
    if (path === "/api/admin/portal" && request.method === "GET")
      return json({ ...await load(env), email, defaultRecipient: env.MAIL_TEST_TO || "", submission: submissionSettings(env) });
    if (path === "/api/admin/portal" && request.method === "PUT") {
      if (!request.headers.get("content-type")?.startsWith("application/json"))
        throw new PortalError(415, "JSON erwartet.");
      let input: Record<string, unknown>;
      try { input = record(JSON.parse(new TextDecoder().decode(await body(request, 2 * 1024 * 1024)))); }
      catch (error) { if (error instanceof PortalError) throw error; throw new PortalError(400, "Ungültiges JSON."); }
      if (!Number.isSafeInteger(input.version) || Number(input.version) < 1) fail("Ungültiger Speicherstand.");
      const state = validatePortal(input);
      // A reference must point to a real upload before it may be published.
      const keys = new Set<string>();
      for (const area of state.areas) if (area.image?.type === "stored") keys.add(area.image.src.slice(7));
      for (const form of state.forms) for (const img of form.guideImages) if (img.src.startsWith("/media/")) keys.add(img.src.slice(7));
      for (const key of keys) if (!await env.MEDIA.head("portal/" + key)) fail("Ein Bild fehlt. Bitte erneut hochladen.");
      const result = await env.DB.prepare(
        "UPDATE portal_content SET data_json = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP, updated_by = ? WHERE id = 'main' AND version = ?",
      ).bind(JSON.stringify(state), email, input.version).run();
      if (result.meta.changes !== 1)
        throw new PortalError(409, "Inzwischen wurde ein anderer Stand gespeichert. Bitte die aktuelle Seite in einem zweiten Tab öffnen und deine Änderungen abgleichen.");
      return json({ version: Number(input.version) + 1, ...state });
    }
    if (path === "/api/admin/media" && request.method === "POST") {
      const bytes = await body(request, 5 * 1024 * 1024), type = imageType(bytes);
      if (request.headers.get("content-type")?.split(";")[0] !== type.type)
        fail("Dateityp und Bildinhalt passen nicht zusammen.");
      const key = crypto.randomUUID() + "." + type.extension;
      await env.MEDIA.put("portal/" + key, bytes, { httpMetadata: { contentType: type.type } });
      return json({ src: "/media/" + key }, 201);
    }
    if ((request.method === "GET" || request.method === "HEAD") && path.startsWith("/api/admin/media/"))
      return await media(request, env, path.slice("/api/admin/media/".length), true);
    if ((request.method === "GET" || request.method === "HEAD") && path.startsWith("/media/"))
      return await media(request, env, path.slice(7), false);
    if (request.method === "GET" && (path === "/admin" || path.startsWith("/admin/"))) {
      const asset = await env.ASSETS.fetch(new Request(new URL("/index.html", url), { headers: request.headers }));
      if (!asset.ok) return asset;
      return new Response((await asset.text()).replace('data-catalog-source="portal"', 'data-catalog-source="portal" data-admin="true"'), {
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store", "x-content-type-options": "nosniff" },
      });
    }
    return json({ error: "Nicht gefunden." }, 404);
  } catch (error) {
    if (error instanceof PortalError) return json({ error: error.message }, error.status);
    console.error("Portal operation failed", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Speichern oder Laden fehlgeschlagen. Bitte erneut versuchen." }, 500);
  }
}
