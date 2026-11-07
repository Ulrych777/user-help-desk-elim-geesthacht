type AdminRow = {
  email: string; display_name: string; active: number; version: number; created_at: string;
};
const json = (data: unknown, status = 200) => Response.json(data, {
  status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
});
const error = (message: string, status: number) => json({ error: message }, status);
const actorExists = "EXISTS (SELECT 1 FROM admins actor WHERE lower(actor.email) = ? AND actor.active = 1)";

async function currentError(db: D1Database, actor: string, email?: string) {
  if (!await db.prepare("SELECT email FROM admins WHERE lower(email) = ? AND active = 1").bind(actor).first())
    return error("Dein Administratorzugang ist nicht mehr aktiv. Bitte melde dich erneut an.", 403);
  if (email && !await db.prepare("SELECT email FROM admins WHERE email = ?").bind(email).first())
    return error("Dieses Administratorkonto ist nicht mehr vorhanden.", 404);
  return error("Der Stand wurde inzwischen geändert. Bitte die Liste neu laden und erneut prüfen.", 409);
}

export async function handleAdministrators(
  method: string, target: string | undefined, input: unknown, db: D1Database, actor: string,
): Promise<Response> {
  try {
    if (method === "GET" && target === undefined) {
      const { results } = await db.prepare(
        "SELECT email, display_name, active, version, created_at FROM admins ORDER BY active DESC, display_name COLLATE NOCASE, email",
      ).all<AdminRow>();
      const activeCount = results.filter(admin => admin.active === 1).length;
      return json({
        administrators: results.map(admin => {
          const isSelf = admin.email.toLowerCase() === actor;
          const isLastActive = admin.active === 1 && activeCount <= 1;
          return {
            email: admin.email, name: admin.display_name, active: admin.active === 1,
            version: admin.version, isSelf, isLastActive,
            canDeactivate: admin.active === 1 && !isSelf && !isLastActive,
            canDelete: !isSelf && !isLastActive,
          };
        }),
      });
    }
    if (!input || typeof input !== "object" || Array.isArray(input))
      return error("Ungültige Kontodaten.", 400);
    const data = input as Record<string, unknown>;
    if (method === "POST" && target === undefined) {
      if (Object.keys(data).some(key => !["email", "name"].includes(key)) ||
          typeof data.email !== "string" || typeof data.name !== "string")
        return error("Bitte Name und E-Mail-Adresse eintragen.", 400);
      const email = data.email.trim().toLowerCase(), name = data.name.trim();
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
          !name || name.length > 150 || /[\x00-\x1f\x7f]/.test(name))
        return error("Bitte einen gültigen Namen und eine gültige E-Mail-Adresse eintragen.", 400);
      const result = await db.prepare(
        "INSERT INTO admins (email, display_name, active) SELECT ?, ?, 1 WHERE " + actorExists +
        " AND (SELECT COUNT(*) FROM admins) < 200",
      ).bind(email, name, actor).run();
      if (result.meta.changes !== 1) {
        if (!await db.prepare("SELECT email FROM admins WHERE lower(email) = ? AND active = 1").bind(actor).first())
          return await currentError(db, actor);
        return error("Die maximale Anzahl von 200 Administratorkonten ist erreicht.", 409);
      }
      return json({ saved: true }, 201);
    }
    if (target === undefined || !["PATCH", "DELETE"].includes(method))
      return error("Nicht gefunden.", 404);
    let email: string;
    try { email = decodeURIComponent(target).trim().toLowerCase(); }
    catch { return error("Ungültige E-Mail-Adresse.", 400); }
    if (!email || email.length > 254) return error("Ungültige E-Mail-Adresse.", 400);
    if (email === actor)
      return error("Du kannst dein eigenes Administratorkonto nicht löschen oder inaktiv setzen.", 403);
    if (!Number.isSafeInteger(data.version) || Number(data.version) < 1)
      return error("Ungültiger Kontostand. Bitte die Liste neu laden.", 400);
    if (method === "PATCH") {
      if (Object.keys(data).some(key => !["version", "active"].includes(key)) || typeof data.active !== "boolean")
        return error("Ungültiger Aktivierungszustand.", 400);
      const result = await db.prepare(
        "UPDATE admins SET active = ?, version = version + 1 WHERE email = ? AND version = ? AND email <> ? AND " + actorExists,
      ).bind(data.active ? 1 : 0, email, data.version, actor, actor).run();
      if (result.meta.changes !== 1) return await currentError(db, actor, email);
      return json({ saved: true });
    }
    if (Object.keys(data).some(key => key !== "version")) return error("Ungültige Löschanfrage.", 400);
    const result = await db.prepare(
      "DELETE FROM admins WHERE email = ? AND version = ? AND email <> ? AND " + actorExists,
    ).bind(email, data.version, actor, actor).run();
    if (result.meta.changes !== 1) return await currentError(db, actor, email);
    return json({ deleted: true });
  } catch (failure) {
    const message = failure instanceof Error ? failure.message : "";
    if (message.includes("last_active_admin"))
      return error("Der letzte aktive Administrator darf nicht inaktiv gesetzt oder gelöscht werden.", 409);
    if (/unique constraint/i.test(message))
      return error("Für diese E-Mail-Adresse gibt es bereits ein Administratorkonto. Ein inaktives Konto kannst du wieder aktivieren.", 409);
    console.error("Administrator operation failed");
    return error("Die Änderung konnte nicht gespeichert werden. Bitte erneut versuchen.", 500);
  }
}
