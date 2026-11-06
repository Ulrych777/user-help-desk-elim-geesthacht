interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  APP_ENV: string;
  PUBLIC_SITE_ENABLED: string;
}

type DatabaseArea = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  image_key: string | null;
  sort_order: number;
};

type DatabaseCategory = {
  id: string;
  area_id: string;
  name: string;
  sort_order: number;
};

type DatabaseConcern = {
  id: string;
  area_id: string;
  slug: string;
  type: "form" | "guide";
  title: string;
  description: string;
  keywords: string;
  upload_enabled: number;
  guide_text: string | null;
  sort_order: number;
};

const json = (data: unknown, init: ResponseInit = {}) =>
  Response.json(data, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...init.headers,
    },
  });

async function health(env: Env): Promise<Response> {
  const database = await env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
  return json({
    ok: database?.ok === 1,
    environment: env.APP_ENV,
    database: database?.ok === 1 ? "ready" : "unavailable",
  });
}

async function publicCatalog(env: Env): Promise<Response> {
  const [areaResult, categoryResult, concernResult, relationResult, fieldResult] =
    await env.DB.batch([
      env.DB.prepare(
        `SELECT id, slug, name, description, icon, image_key, sort_order
         FROM areas WHERE published = 1 ORDER BY sort_order, name`,
      ),
      env.DB.prepare(
        `SELECT c.id, c.area_id, c.name, c.sort_order
         FROM categories c
         JOIN areas a ON a.id = c.area_id
         WHERE a.published = 1 ORDER BY c.sort_order, c.name`,
      ),
      env.DB.prepare(
        `SELECT c.id, c.area_id, c.slug, c.type, c.title, c.description,
                c.keywords, c.upload_enabled, c.guide_text, c.sort_order
         FROM concerns c
         JOIN areas a ON a.id = c.area_id
         WHERE c.published = 1 AND a.published = 1
         ORDER BY c.sort_order, c.title`,
      ),
      env.DB.prepare(
        `SELECT concern_id, category_id
         FROM concern_categories ORDER BY concern_id, category_id`,
      ),
      env.DB.prepare(
        `SELECT id, concern_id, type, label, required, options_json, sort_order
         FROM form_fields ORDER BY concern_id, sort_order, id`,
      ),
    ]);

  return json({
    areas: (areaResult.results as DatabaseArea[]).map((area) => ({
      ...area,
      categories: (categoryResult.results as DatabaseCategory[]).filter(
        (category) => category.area_id === area.id,
      ),
    })),
    concerns: (concernResult.results as DatabaseConcern[]).map((concern) => ({
      ...concern,
      upload_enabled: concern.upload_enabled === 1,
      categories: (
        relationResult.results as Array<{
          concern_id: string;
          category_id: string;
        }>
      )
        .filter((relation) => relation.concern_id === concern.id)
        .map((relation) => relation.category_id),
      fields: (
        fieldResult.results as Array<{
          id: string;
          concern_id: string;
          type: string;
          label: string;
          required: number;
          options_json: string;
          sort_order: number;
        }>
      )
        .filter((field) => field.concern_id === concern.id)
        .map((field) => ({
          ...field,
          required: field.required === 1,
          options: JSON.parse(field.options_json),
          options_json: undefined,
        })),
    })),
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (request.method === "GET" && url.pathname === "/api/health") {
        return health(env);
      }
      if (request.method === "GET" && url.pathname === "/api/catalog") {
        return publicCatalog(env);
      }
      if (url.pathname.startsWith("/api/")) {
        return json({ error: "Nicht gefunden" }, { status: 404 });
      }
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error("Serviceportal request failed", error);
      return json(
        { error: "Die Anfrage konnte nicht verarbeitet werden." },
        { status: 500 },
      );
    }
  },
};
