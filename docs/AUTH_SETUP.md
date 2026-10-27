# StudySense authentication setup

## What this branch adds
- Email/password registration and sign-in using PBKDF2-SHA-256 password hashes.
- Signed, HttpOnly, Secure, SameSite=Lax session cookies.
- Per-user task list, create, complete, and delete endpoints backed by D1.
- A frontend that uses the API instead of localStorage for new tasks.

## Before enabling it on the live site
1. Review and merge this branch into `main`. Keep the existing `DB` binding in `wrangler.jsonc`.
2. In Cloudflare Dashboard, open Workers & Pages → your `studysense` Worker → Settings → Variables and Secrets. Add a **secret** named `SESSION_SECRET` containing a randomly generated value with at least 32 characters. Do not put the value in GitHub or in frontend JavaScript. Generate one locally with `openssl rand -base64 48` if OpenSSL is installed.
3. Apply the migration to the correct D1 database once, after confirming the migration list and database name:
   `npx wrangler d1 migrations apply studysense-db --remote`
   Run this from the repository root in a terminal where Wrangler is authenticated to the correct Cloudflare account. Review the command output before proceeding. The migration is additive: it adds nullable `google_sub` and a unique partial index; it does not drop or rebuild `users`.
4. Wait for the Worker deployment to finish. Test `/api/health`, create a test account, sign out/in, create a task, mark it complete, delete it, and verify a second account cannot see the first account's tasks.
5. Configure Cloudflare rate limiting for `/api/auth/login` and `/api/auth/register` before public launch.

## Current limits
- Google sign-in is not implemented yet; `google_sub` only prepares the schema for a future OAuth flow.
- Existing tasks in a browser's old localStorage are not automatically imported. They remain in that browser's storage, but the new planner reads tasks from D1.
- Account recovery, email verification, and automated abuse/rate-limit controls still need to be added before treating this as a production authentication system.
- Never share your `SESSION_SECRET`, passwords, or OAuth client secret in chat or source control.
