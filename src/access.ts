export interface AccessEnv {
  DB: D1Database;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
}

type AccessKey = JsonWebKey & { kid: string };
let keyCache: { issuer: string; keys: AccessKey[]; expires: number } | undefined;

function decode(part: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(part)) throw new Error("Invalid JWT");
  return Uint8Array.from(atob(part.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
}

export async function adminIdentity(request: Request, env: AccessEnv): Promise<string | null> {
  try {
    if (!env.CF_ACCESS_TEAM_DOMAIN?.match(/^[a-z0-9-]+\.cloudflareaccess\.com$/) ||
        !env.CF_ACCESS_AUD) return null;
    const token = request.headers.get("Cf-Access-Jwt-Assertion");
    if (!token || token.length > 16000) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const header = JSON.parse(new TextDecoder().decode(decode(parts[0])));
    const claims = JSON.parse(new TextDecoder().decode(decode(parts[1])));
    const issuer = "https://" + env.CF_ACCESS_TEAM_DOMAIN;
    const now = Math.floor(Date.now() / 1000);
    if (header.alg !== "RS256" || typeof header.kid !== "string" ||
        claims.iss !== issuer || !Array.isArray(claims.aud) ||
        !claims.aud.includes(env.CF_ACCESS_AUD) || !claims.sub ||
        !Number.isInteger(claims.exp) || claims.exp <= now ||
        !Number.isInteger(claims.iat) || claims.iat > now + 30 ||
        (claims.nbf !== undefined && (!Number.isInteger(claims.nbf) || claims.nbf > now + 30)) ||
        typeof claims.email !== "string") return null;
    const email = claims.email.toLowerCase();
    if (!keyCache || keyCache.issuer !== issuer || keyCache.expires <= now) {
      const response = await fetch(issuer + "/cdn-cgi/access/certs", { signal: AbortSignal.timeout(10000) });
      if (!response.ok) return null;
      const jwks = await response.json() as { keys: AccessKey[] };
      if (!Array.isArray(jwks.keys)) return null;
      keyCache = { issuer, keys: jwks.keys, expires: now + 300 };
    }
    const jwk = keyCache.keys.find(k => k.kid === header.kid && k.kty === "RSA");
    if (!jwk) { keyCache = undefined; return null; }
    const key = await crypto.subtle.importKey("jwk", jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key,
      decode(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1]));
    if (!valid) return null;
    const admin = await env.DB.prepare("SELECT email FROM admins WHERE lower(email) = ? AND active = 1")
      .bind(email).first<{ email: string }>();
    return admin ? email : null;
  } catch {
    return null;
  }
}
