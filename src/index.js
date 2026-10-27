const COOKIE_NAME = "__Host-studysense_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const PASSWORD_ITERATIONS = 100000;

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
async function hashPassword(password, saltBytes) {
  const salt = saltBytes || crypto.getRandomValues(new Uint8Array(16));
  let stage = "importing PBKDF2 key";
  try {
    const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
    stage = "deriving PBKDF2-SHA-256 bits";
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: PASSWORD_ITERATIONS }, material, 256);
    return "pbkdf2_sha256$" + PASSWORD_ITERATIONS + "$" + b64url(salt) + "$" + b64url(new Uint8Array(bits));
  } catch (error) {
    console.error("StudySense password hashing failed", {
      stage,
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error)
    });
    throw new Error(`Password hashing failed at ${stage}.`);
  }
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

const GOOGLE_STATE_COOKIE = "__Host-studysense_oauth_state";
const GOOGLE_STATE_SECONDS = 600;

async function signState(payload, secret) {
  const encoded = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  return encoded + "." + b64url(await hmac(secret, encoded));
}
async function verifyState(token, secret) {
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const expected = await hmac(secret, parts[0]);
    const supplied = fromB64url(parts[1]);
    if (expected.length !== supplied.length || !expected.every((v, i) => v === supplied[i])) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(parts[0])));
    if (!payload.exp || payload.exp < Date.now() / 1000 || !payload.nonce || !["login", "link"].includes(payload.mode)) return null;
    return payload;
  } catch { return null; }
}
function oauthStateCookie(value, maxAge = GOOGLE_STATE_SECONDS) {
  return `${GOOGLE_STATE_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
function redirectWithGoogleStatus(request, status) {
  const target = new URL("/", request.url);
  target.searchParams.set("google", status);
  return Response.redirect(target.toString(), 303);
}
async function googleIdentityFromCode(code, request, env, nonce) {
  const redirectUri = new URL("/api/auth/google/callback", request.url).toString();
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });
  if (!tokenResponse.ok) throw new Error("Google token exchange failed");
  const tokenData = await tokenResponse.json();
  if (typeof tokenData.id_token !== "string") throw new Error("Google did not return an ID token");

  const jwtParts = tokenData.id_token.split(".");
  if (jwtParts.length !== 3) throw new Error("Invalid Google ID token");
  const header = JSON.parse(new TextDecoder().decode(fromB64url(jwtParts[0])));
  const claims = JSON.parse(new TextDecoder().decode(fromB64url(jwtParts[1])));
  if (header.alg !== "RS256" || typeof header.kid !== "string") throw new Error("Unsupported Google ID token");
  const keysResponse = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  if (!keysResponse.ok) throw new Error("Could not retrieve Google's signing keys");
  const keySet = await keysResponse.json();
  const jwk = keySet.keys?.find(key => key.kid === header.kid && key.use === "sig" && key.alg === "RS256");
  if (!jwk) throw new Error("Google signing key not found");
  const publicKey = await crypto.subtle.importKey(
    "jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]
  );
  const validSignature = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5", publicKey, fromB64url(jwtParts[2]),
    new TextEncoder().encode(jwtParts[0] + "." + jwtParts[1])
  );
  if (!validSignature) throw new Error("Google ID token signature is invalid");
  const now = Math.floor(Date.now() / 1000);
  const audience = Array.isArray(claims.aud) ? claims.aud.includes(env.GOOGLE_CLIENT_ID) : claims.aud === env.GOOGLE_CLIENT_ID;
  if (!["accounts.google.com", "https://accounts.google.com"].includes(claims.iss) ||
      !audience || (claims.exp || 0) <= now || (claims.iat || 0) > now + 60 ||
      claims.nonce !== nonce || claims.email_verified !== true ||
      typeof claims.sub !== "string" || typeof claims.email !== "string") {
    throw new Error("Google ID token claims are invalid");
  }
  return { sub: claims.sub, email: claims.email.trim().toLowerCase() };
}

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


    if (url.pathname === "/api/auth/google/start" && request.method === "GET") {
      if (!env.GOOGLE_CLIENT_ID) return json({ error: "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the Worker." }, 503);
      const mode = url.searchParams.get("mode") === "link" ? "link" : "login";
      let currentSession = null;
      if (mode === "link") {
        currentSession = await readSession(request, env.SESSION_SECRET);
        if (!currentSession) return redirectWithGoogleStatus(request, "signin_required");
      }
      const state = await signState({
        mode,
        userId: currentSession?.sub || null,
        nonce: b64url(crypto.getRandomValues(new Uint8Array(24))),
        exp: Math.floor(Date.now() / 1000) + GOOGLE_STATE_SECONDS
      }, env.SESSION_SECRET);
      const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      googleUrl.search = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: new URL("/api/auth/google/callback", request.url).toString(),
        response_type: "code",
        scope: "openid email profile",
        state,
        nonce: (await verifyState(state, env.SESSION_SECRET)).nonce,
        prompt: "select_account"
      }).toString();
      return new Response(null, {
        status: 302,
        headers: {
          "location": googleUrl.toString(),
          "cache-control": "no-store",
          "set-cookie": oauthStateCookie(state)
        }
      });
    }

    if (url.pathname === "/api/auth/google/callback" && request.method === "GET") {
      const stateToken = url.searchParams.get("state");
      const savedState = cookie(request, GOOGLE_STATE_COOKIE);
      const state = await verifyState(stateToken, env.SESSION_SECRET);
      const clearStateCookie = oauthStateCookie("", 0);
      if (!state || !savedState || stateToken !== savedState) {
        return new Response(null, { status: 303, headers: { "location": new URL("/?google=invalid_state", request.url).toString(), "set-cookie": clearStateCookie, "cache-control": "no-store" } });
      }
      if (url.searchParams.has("error") || !url.searchParams.get("code")) {
        return new Response(null, { status: 303, headers: { "location": new URL("/?google=cancelled", request.url).toString(), "set-cookie": clearStateCookie, "cache-control": "no-store" } });
      }
      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
        return new Response(null, { status: 303, headers: { "location": new URL("/?google=not_configured", request.url).toString(), "set-cookie": clearStateCookie, "cache-control": "no-store" } });
      }
      try {
        const identity = await googleIdentityFromCode(url.searchParams.get("code"), request, env, state.nonce);
        let user;
        if (state.mode === "link") {
          const currentSession = await readSession(request, env.SESSION_SECRET);
          if (!currentSession || currentSession.sub !== state.userId) {
            return new Response(null, { status: 303, headers: { "location": new URL("/?google=signin_required", request.url).toString(), "set-cookie": clearStateCookie, "cache-control": "no-store" } });
          }
          const [existingGoogleUser, currentUser, emailUser] = await Promise.all([
            env.DB.prepare("SELECT id FROM users WHERE google_sub = ?").bind(identity.sub).first(),
            env.DB.prepare("SELECT google_sub FROM users WHERE id = ?").bind(currentSession.sub).first(),
            env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(identity.email).first()
          ]);
          if ((existingGoogleUser && existingGoogleUser.id !== currentSession.sub) ||
              (currentUser?.google_sub && currentUser.google_sub !== identity.sub)) {
            return new Response(null, { status: 303, headers: { "location": new URL("/?google=already_linked", request.url).toString(), "set-cookie": clearStateCookie, "cache-control": "no-store" } });
          }
          if (emailUser && emailUser.id !== currentSession.sub) {
            return new Response(null, { status: 303, headers: { "location": new URL("/?google=email_conflict", request.url).toString(), "set-cookie": clearStateCookie, "cache-control": "no-store" } });
          }
          await env.DB.prepare("UPDATE users SET google_sub = ? WHERE id = ?").bind(identity.sub, currentSession.sub).run();
          return new Response(null, { status: 303, headers: { "location": new URL("/?google=linked", request.url).toString(), "set-cookie": clearStateCookie, "cache-control": "no-store" } });
        }

        user = await env.DB.prepare("SELECT id, email FROM users WHERE google_sub = ?").bind(identity.sub).first();
        if (!user) {
          const emailUser = await env.DB.prepare("SELECT id, email, google_sub FROM users WHERE email = ?").bind(identity.email).first();
          if (emailUser) {
            return new Response(null, { status: 303, headers: { "location": new URL("/?google=link_required", request.url).toString(), "set-cookie": clearStateCookie, "cache-control": "no-store" } });
          }
          const id = crypto.randomUUID();
          await env.DB.prepare("INSERT INTO users (id, email, password_hash, google_sub) VALUES (?, ?, NULL, ?)").bind(id, identity.email, identity.sub).run();
          user = { id, email: identity.email };
        }
        const token = await makeSession(user, env.SESSION_SECRET);
        const headers = new Headers({
          "location": new URL("/", request.url).toString(),
          "cache-control": "no-store"
        });
        headers.append("set-cookie", sessionCookie(token));
        headers.append("set-cookie", clearStateCookie);
        return new Response(null, { status: 303, headers });
      } catch (error) {
        console.error("StudySense Google OAuth failed", {
          name: error instanceof Error ? error.name : "UnknownError",
          message: error instanceof Error ? error.message : String(error)
        });
        return new Response(null, { status: 303, headers: { "location": new URL("/?google=failed", request.url).toString(), "set-cookie": clearStateCookie, "cache-control": "no-store" } });
      }
    }

    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      const body = await bodyJson(request);
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body?.password === "string" ? body.password : "";
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Enter a valid email address." }, 400);
      if (password.length < 10 || password.length > 128) return json({ error: "Use a password between 10 and 128 characters." }, 400);
      let stage = "checking existing account";
      try {
        const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
        if (existing) return json({ error: "An account with that email already exists. Try signing in." }, 409);
        const id = crypto.randomUUID();
        stage = "hashing password";
        const passwordHash = await hashPassword(password);
        stage = "saving account";
        await env.DB.prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)").bind(id, email, passwordHash).run();
        stage = "creating session";
        const token = await makeSession({ id, email }, env.SESSION_SECRET);
        return json({ user: { id, email } }, 201, { "set-cookie": sessionCookie(token) });
      } catch (error) {
        console.error("StudySense registration failed", {
          stage,
          name: error instanceof Error ? error.name : "UnknownError",
          message: error instanceof Error ? error.message : String(error)
        });
        const detail = error instanceof Error && error.message.startsWith("Password hashing failed at ") ? error.message : `Account creation failed while ${stage}. Please try again.`;
        return json({ error: detail }, 500);
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


    if (url.pathname === "/api/exams" || url.pathname.startsWith("/api/exams/") || url.pathname === "/api/chapters" || url.pathname.startsWith("/api/chapters/")) {
      const session = await readSession(request, env.SESSION_SECRET);
      if (!session) return json({ error: "Please sign in to manage exams and syllabus." }, 401);
      if (url.pathname === "/api/exams" && request.method === "GET") {
        try {
          const e = await env.DB.prepare("SELECT id,name,exam_date FROM exams WHERE user_id=? ORDER BY exam_date").bind(session.sub).all();
          const c = await env.DB.prepare("SELECT id,exam_id,subject,title,status FROM chapters WHERE user_id=? ORDER BY created_at DESC").bind(session.sub).all();
          return json({ exams: e.results || [], chapters: c.results || [] });
        } catch { return json({ error: "Exam database migration is not applied yet." }, 503); }
      }
      if (url.pathname === "/api/exams" && request.method === "POST") {
        const b = await bodyJson(request), name = typeof b?.name === "string" ? b.name.trim() : "", date = typeof b?.exam_date === "string" ? b.exam_date : "";
        if (!name || name.length > 100) return json({ error: "Exam name must be 1–100 characters." }, 400);
        if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(date) || Number.isNaN(Date.parse(date + "T00:00:00Z"))) return json({ error: "Choose a valid exam date." }, 400);
        const id = crypto.randomUUID();
        try { await env.DB.prepare("INSERT INTO exams(id,user_id,name,exam_date) VALUES(?,?,?,?)").bind(id,session.sub,name,date).run(); return json({ exam: { id,name,exam_date:date } },201); }
        catch { return json({ error: "Could not save exam. Check the database migration." },500); }
      }
      const em = url.pathname.match(/^\\/api\\/exams\\/([0-9a-f-]{36})$/i);
      if (em && request.method === "DELETE") {
        try { const r=await env.DB.prepare("DELETE FROM exams WHERE id=? AND user_id=?").bind(em[1],session.sub).run(); if(!r.meta?.changes)return json({error:"Exam not found."},404); await env.DB.prepare("DELETE FROM chapters WHERE exam_id=? AND user_id=?").bind(em[1],session.sub).run(); return json({ok:true}); }
        catch { return json({error:"Could not delete exam."},500); }
      }
      if (url.pathname === "/api/chapters" && request.method === "POST") {
        const b=await bodyJson(request), title=typeof b?.title==="string"?b.title.trim():"", subject=typeof b?.subject==="string"?b.subject:"", examId=typeof b?.exam_id==="string"?b.exam_id:"";
        const subjects=["Mathematics","Science","Social Science","English","Hindi","Telugu","IT-402","Skill Education","Vocational Education"];
        if(!title||title.length>150)return json({error:"Chapter name must be 1–150 characters."},400);
        if(!subjects.includes(subject))return json({error:"Choose a valid subject."},400);
        const exam=await env.DB.prepare("SELECT id FROM exams WHERE id=? AND user_id=?").bind(examId,session.sub).first();
        if(!exam)return json({error:"Choose one of your exams."},400);
        const id=crypto.randomUUID();
        try { await env.DB.prepare("INSERT INTO chapters(id,user_id,exam_id,subject,title) VALUES(?,?,?,?,?)").bind(id,session.sub,examId,subject,title).run(); return json({chapter:{id,exam_id:examId,subject,title,status:"not_started"}},201); }
        catch { return json({error:"Could not save chapter."},500); }
      }
      const cm=url.pathname.match(/^\\/api\\/chapters\\/([0-9a-f-]{36})$/i);
      if(cm&&request.method==="PATCH"){
        const b=await bodyJson(request), allowed=["not_started","learning","revising","mastered"];
        if(!allowed.includes(b?.status))return json({error:"Choose a valid status."},400);
        try{const r=await env.DB.prepare("UPDATE chapters SET status=? WHERE id=? AND user_id=?").bind(b.status,cm[1],session.sub).run();if(!r.meta?.changes)return json({error:"Chapter not found."},404);return json({ok:true});}catch{return json({error:"Could not update chapter."},500);}
      }
      if(cm&&request.method==="DELETE"){try{const r=await env.DB.prepare("DELETE FROM chapters WHERE id=? AND user_id=?").bind(cm[1],session.sub).run();if(!r.meta?.changes)return json({error:"Chapter not found."},404);return json({ok:true});}catch{return json({error:"Could not delete chapter."},500);}}
      return json({error:"API route not found."},404);
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
