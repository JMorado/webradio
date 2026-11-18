import { error, json, readJson } from "../../../lib/http.js";
import { validateProgramme } from "../../../lib/schedule.js";

const cookieName = "__Secure-pomboradio_admin";
const sessionSeconds = 12 * 60 * 60;
const keyPattern = /^[0-9a-f]{64}$/;
const programmeId = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const encoder = new TextEncoder();

function sessionCookie(token, maxAge) {
  return {
    "Set-Cookie": cookieName + "=" + token
      + "; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=" + maxAge,
  };
}

function readToken(request) {
  const cookie = request.headers.get("Cookie") || "";
  const value = cookie.split(/;\s*/).find((part) => part.startsWith(cookieName + "="))
    ?.slice(cookieName.length + 1);
  return keyPattern.test(value || "") ? value : null;
}

function hex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function tokenHash(token, secret) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token + secret));
  return hex(new Uint8Array(digest));
}

async function login(request, db, secret) {
  const body = await readJson(request);
  const key = body?.key;
  if (typeof key !== "string" || !keyPattern.test(key)
      || !crypto.subtle.timingSafeEqual(encoder.encode(key), encoder.encode(secret))) {
    return error("Chave de acesso incorreta.", 401);
  }

  const now = Math.floor(Date.now() / 1000);
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  const hash = await tokenHash(token, secret);
  await db.batch([
    db.prepare("DELETE FROM admin_sessions WHERE expires_at <= ?").bind(now),
    db.prepare("INSERT INTO admin_sessions (token_hash, expires_at) VALUES (?, ?)").bind(hash, now + sessionSeconds),
  ]);
  return json({ authenticated: true }, 200, sessionCookie(token, sessionSeconds));
}

async function handleProgrammes(request, db, id) {
  if (!id && request.method === "GET") {
    const { results } = await db.prepare("SELECT * FROM programmes ORDER BY starts_on, starts_at, title").all();
    return json({ programmes: results });
  }

  if (!id && request.method === "POST") {
    const values = validateProgramme(await readJson(request));
    const newId = crypto.randomUUID();
    const programme = await db.prepare(
      `INSERT INTO programmes (id, title, host, description, starts_on, starts_at, duration_minutes, weekly, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
    ).bind(newId, ...values).first();
    return json({ programme }, 201);
  }

  if (!id || !["PUT", "DELETE"].includes(request.method)) return error("Método indisponível.", 405);
  if (!programmeId.test(id)) return error("Programa inexistente.", 404);

  const body = await readJson(request);
  if (!Number.isSafeInteger(body?.revision) || body.revision < 1) {
    return error("Atualiza a lista e volta a tentar.", 400);
  }

  const programme = request.method === "DELETE"
    ? await db.prepare("DELETE FROM programmes WHERE id = ? AND revision = ? RETURNING id").bind(id, body.revision).first()
    : await db.prepare(
      `UPDATE programmes
       SET title = ?, host = ?, description = ?, starts_on = ?, starts_at = ?,
           duration_minutes = ?, weekly = ?, published = ?, revision = revision + 1
       WHERE id = ? AND revision = ? RETURNING *`
    ).bind(...validateProgramme(body), id, body.revision).first();

  if (!programme) return error("Este programa foi alterado noutra sessão. Atualiza a lista e volta a abri-lo.", 409);
  return json({ programme });
}

export async function onRequest({ request, env }) {
  const db = env.PROGRAMACAO_DB;
  const secret = env.ADMIN_ACCESS_KEY;
  if (!db || typeof secret !== "string" || !keyPattern.test(secret)) {
    return error("O painel ainda não está configurado.", 503);
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");
  if (request.method !== "GET" && request.headers.get("Origin") !== url.origin) {
    return error("Pedido de outra origem recusado.", 403);
  }

  try {
    if (path === "/api/admin/session" && request.method === "POST") return await login(request, db, secret);

    const token = readToken(request);
    const hash = token ? await tokenHash(token, secret) : null;
    if (path === "/api/admin/session" && request.method === "DELETE") {
      if (hash) await db.prepare("DELETE FROM admin_sessions WHERE token_hash = ?").bind(hash).run();
      return json({ authenticated: false }, 200, sessionCookie("", 0));
    }

    const session = hash && await db.prepare("SELECT 1 FROM admin_sessions WHERE token_hash = ? AND expires_at > ?")
      .bind(hash, Math.floor(Date.now() / 1000)).first();
    if (!session) return error("Inicia sessão para continuar.", 401);

    if (path === "/api/admin/session" && request.method === "GET") return json({ authenticated: true });
    const match = /^\/api\/admin\/programas(?:\/([^/]+))?$/.exec(path);
    if (match) return await handleProgrammes(request, db, match[1]);
    return error("Página inexistente.", 404);
  } catch (cause) {
    if (cause instanceof RangeError) return error(cause.message, 400);
    if (cause instanceof SyntaxError) return error("O pedido não é válido.", 400);
    console.error("Failed to manage programme schedule", cause);
    return error("Não foi possível concluir o pedido.", 500);
  }
}
