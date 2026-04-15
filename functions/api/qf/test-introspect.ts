// Diagnostic-only server-side /oauth2/introspect probe for the 2026-04-15
// investigation. RFC 7662 token introspection requires client credentials
// (client_secret_basic), which live in the Pages Function env — we can't
// call this from the browser. This function takes the access token from
// the x-auth-token header and introspects it against Hydra's introspection
// endpoint with our proxy's client credentials.
//
// The response tells us Hydra's ground truth about the token:
//   { active, scope, client_id, sub, exp, iat, nbf, aud, iss }
//
// If active=false, Hydra considers the token invalid (expired, revoked, or
// otherwise) regardless of what the JWT payload says. If active=true, the
// token is genuinely live at Hydra's layer — any rejection elsewhere is
// downstream of Hydra.
//
// Delete once the investigation is resolved.

interface Env {
  QF_CLIENT_ID: string;
  QF_CLIENT_SECRET: string;
  QF_INTROSPECT_ENDPOINT?: string;
}

interface EventContext {
  request: Request;
  env: Env;
}

const DEFAULT_INTROSPECT_ENDPOINT =
  "https://prelive-oauth2.quran.foundation/oauth2/introspect";

export const onRequestGet = async ({
  request,
  env,
}: EventContext): Promise<Response> => {
  if (!env.QF_CLIENT_ID || !env.QF_CLIENT_SECRET) {
    return new Response(
      JSON.stringify({
        error: "proxy_misconfigured",
        detail: "QF_CLIENT_ID or QF_CLIENT_SECRET not set on the Worker",
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  const token = request.headers.get("x-auth-token");
  if (!token) {
    return new Response(
      JSON.stringify({
        error: "missing_token",
        detail: "x-auth-token header is required",
      }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  const form = new URLSearchParams({ token });
  const basic = btoa(`${env.QF_CLIENT_ID}:${env.QF_CLIENT_SECRET}`);
  const endpoint = env.QF_INTROSPECT_ENDPOINT ?? DEFAULT_INTROSPECT_ENDPOINT;

  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: `Basic ${basic}`,
      },
      body: form.toString(),
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "upstream_unreachable",
        detail: err instanceof Error ? err.message : String(err),
      }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }

  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
};

export const onRequest = async (): Promise<Response> =>
  new Response(
    JSON.stringify({ error: "method_not_allowed", detail: "GET only" }),
    { status: 405, headers: { "content-type": "application/json" } }
  );
