const COOKIE_NAME = "__Host-studysense_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const PASSWORD_ITERATIONS = 310000;

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extraHeaders }
  });
}
function cookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const entry = header.split(";").map(x => x.trim()).find(x => x.startsWith(name + "="));
  return entry ? entry.slice(name.length + 1) : null;
}
function b64url(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function fromB64url(value) {
  const base = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base + "=".repeat((4 - base.length % 4) % 4));
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}
async function hmac(secret, value) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}
async function makeSession(user, secret) {
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ sub: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })));
  return payload + "." + b64url(await hmac(secret, payload));
}
async function readSession(request, secret) {
  const token = cookie(request, COOKIE_NAME);
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const expected = await hmac(secret, parts[0]);
    const supplied = fromB64url(parts[1]);
    if (expected.length !== supplied.length || !expected.every((v, i) => v === supplied[i])) return null;
    const session = JSON.parse(new TextDecoder().decode(fromB64url(parts[0])));
    if (!session.sub || !session.email || session.exp < Date.now() / 1000) return null;
    return session;
  } catch { return null; }
}
function sessionCookie(token, maxAge = SESSION_SECONDS) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
async function hashPassword(password, saltBytes = crypto.getRandomValues(new Uint8Array(16))) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations: PASSWORD_ITERATIONS }, material, 256);
  return `pbkdf2_sha256$${PASSWORD_ITERATIONS}$${b64url(saltBytes)}$${b64url(new Uint8Array(bits))}`;
}
async function verifyPassword(password, stored) {
  if (typeof stored !== "string") return false;
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2_sha256" || Number(parts[1]) !== PASSWORD_ITERATIONS) return false;
  const actual = await hashPassword(password, fromB64url(parts[2]));
  const a = new TextEncoder().encode(actual), b = new TextEncoder().encode(stored);
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
async function bodyJson(request) {
  try { return await request.json(); } catch { return null; }
}
function validOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}
function setCorsVary(headers) { headers.set("vary", "Origin"); return headers; }

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "allow": "GET, POST, PATCH, DELETE, OPTIONS" } });

    if (url.pathname === "/api/health" && request.method === "GET") {
      try {
        await env.DB.prepare("SELECT id FROM users LIMIT 1").first();
        await env.DB.prepare("SELECT id FROM tasks LIMIT 1").first();
        return json({ ok: true, database: "connected" });
      } catch {
        return json({ ok: false, error: "Database query failed. Check that migrations have been applied." }, 500);
      }
    }

    if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
      return json({ error: "Server authentication is not configured yet. Set SESSION_SECRET in Worker secrets." }, 503);
    }

    if (["POST", "PATCH", "DELETE"].includes(request.method) && !validOrigin(request)) {
      return json({ error: "Invalid request origin." }, 403);
    }

    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      const body = await bodyJson(request);
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body?.password === "string" ? body.password : "";
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Enter a valid email address." }, 400);
      if (password.length < 10 || password.length > 128) return json({ error: "Use a password between 10 and 128 characters." }, 400);
      try {
        const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
        if (existing) return json({ error: "An account with that email already exists. Try signing in." }, 409);
        const id = crypto.randomUUID();
        const passwordHash = await hashPassword(password);
        await env.DB.prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)").bind(id, email, passwordHash).run();
        const token = await makeSession({ id, email }, env.SESSION_SECRET);
        return json({ user: { id, email } }, 201, { "set-cookie": sessionCookie(token) });
      } catch (error) {
        console.error("StudySense registration failed", {
          name: error instanceof Error ? error.name : "UnknownError",
          message: error instanceof Error ? error.message : String(error)
        });
        return json({ error: "Could not create the account. Please try again." }, 500);
      }
    }

    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      const body = await bodyJson(request);
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body?.password === "string" ? body.password : "";
      if (!email || !password || email.length > 254 || password.length > 128) return json({ error: "Enter your email and password." }, 400);
      try {
        const user = await env.DB.prepare("SELECT id, email, password_hash FROM users WHERE email = ?").bind(email).first();
        if (!user || !(await verifyPassword(password, user.password_hash))) return json({ error: "Email or password is incorrect." }, 401);
        const token = await makeSession(user, env.SESSION_SECRET);
        return json({ user: { id: user.id, email: user.email } }, 200, { "set-cookie": sessionCookie(token) });
      } catch {
        return json({ error: "Could not sign in. Please try again." }, 500);
      }
    }

    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      return json({ ok: true }, 200, { "set-cookie": sessionCookie("", 0) });
    }

    if (url.pathname === "/api/auth/me" && request.method === "GET") {
      const session = await readSession(request, env.SESSION_SECRET);
      return session ? json({ user: { id: session.sub, email: session.email } }) : json({ user: null });
    }

    if (url.pathname.startsWith("/api/tasks")) {
      const session = await readSession(request, env.SESSION_SECRET);
      if (!session) return json({ error: "Please sign in to access your tasks." }, 401);

      if (url.pathname === "/api/tasks" && request.method === "GET") {
        try {
          const { results = [] } = await env.DB.prepare(
            "SELECT id, title, subject, completed, created_at FROM tasks WHERE user_id = ? ORDER BY created_at DESC"
          ).bind(session.sub).all();
          return json({ tasks: results.map(t => ({ ...t, done: t.completed === 1 })) });
        } catch { return json({ error: "Could not load tasks." }, 500); }
      }

      if (url.pathname === "/api/tasks" && request.method === "POST") {
        const body = await bodyJson(request);
        const title = typeof body?.title === "string" ? body.title.trim() : "";
        const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
        const subjects = ["Mathematics", "Science", "Social Science", "English", "Hindi", "Telugu", "IT-402", "Skill Education", "Vocational Education"];
        if (!title || title.length > 200) return json({ error: "Task title must be between 1 and 200 characters." }, 400);
        if (!subjects.includes(subject)) return json({ error: "Choose a valid subject." }, 400);
        const id = crypto.randomUUID();
        try {
          await env.DB.prepare("INSERT INTO tasks (id, user_id, title, subject) VALUES (?, ?, ?, ?)").bind(id, session.sub, title, subject).run();
          return json({ task: { id, title, subject, completed: 0, done: false } }, 201);
        } catch { return json({ error: "Could not save the task." }, 500); }
      }

      const match = url.pathname.match(/^\/api\/tasks\/([0-9a-f-]{36})$/i);
      if (match && request.method === "PATCH") {
        const body = await bodyJson(request);
        if (typeof body?.done !== "boolean") return json({ error: "Task completion must be true or false." }, 400);
        try {
          const result = await env.DB.prepare("UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?").bind(body.done ? 1 : 0, match[1], session.sub).run();
          if (!result.meta?.changes) return json({ error: "Task not found." }, 404);
          return json({ ok: true });
        } catch { return json({ error: "Could not update the task." }, 500); }
      }
      if (match && request.method === "DELETE") {
        try {
          const result = await env.DB.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").bind(match[1], session.sub).run();
          if (!result.meta?.changes) return json({ error: "Task not found." }, 404);
          return json({ ok: true });
        } catch { return json({ error: "Could not delete the task." }, 500); }
      }
      return json({ error: "API route not found." }, 404);
    }

    return json({ error: "API route not found." }, 404);
  }
};
