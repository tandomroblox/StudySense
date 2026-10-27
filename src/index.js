
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      try {
        const result = await env.DB.prepare(
          "SELECT COUNT(*) AS count FROM users"
        ).first();

        return Response.json({
          ok: true,
          database: "connected",
          usersTableAccessible: result !== null
        });
      } catch (error) {
        return Response.json(
          { ok: false, error: "Database query failed" },
          { status: 500 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
