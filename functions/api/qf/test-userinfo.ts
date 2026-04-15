// Diagnostic-only server-side /oauth2/userinfo probe for the 2026-04-15
// investigation. Browser probes 1 and 2 on /debug/auth fail CORS because
// the userinfo endpoint does not set Access-Control-Allow-Origin for the
// siraj-noor.pages.dev origin. This Pages Function forwards the same
// request from a Cloudflare Worker (no Origin header), so we can actually
// see what Hydra says about the session.
//
// Runs TWO parallel requests to isolate header format sensitivity:
//   (a) Authorization: Bearer <token> — OIDC RFC 6750 standard
//   (b) x-auth-token + x-client-id — QF's custom header pattern used by
//       every other endpoint in their API surface
//
// Reports both results in a single response so probe 12 shows whether
// Hydra's /userinfo accepts either format.
//
// Delete once the investigation is resolved.

interface EventContext {
  request: Request;
}

const USERINFO_URL = "https://prelive-oauth2.quran.foundation/userinfo";

interface ProbeResult {
  status: number;
  body: unknown;
}

async function runProbe(headers: HeadersInit): Promise<ProbeResult> {
  try {
    const upstream = await fetch(USERINFO_URL, { headers });
    const text = await upstream.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      /* leave as string */
    }
    return { status: upstream.status, body };
  } catch (err) {
    return {
      status: 0,
      body: {
        fetch_error: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

export const onRequestGet = async ({
  request,
}: EventContext): Promise<Response> => {
  const token = request.headers.get("x-auth-token");
  const clientId = request.headers.get("x-client-id");

  if (!token || !clientId) {
    return new Response(
      JSON.stringify({
        error: "missing_headers",
        detail: "x-auth-token and x-client-id are required",
      }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  const [bearerResult, customResult] = await Promise.all([
    runProbe({ authorization: `Bearer ${token}` }),
    runProbe({
      "x-auth-token": token,
      "x-client-id": clientId,
    }),
  ]);

  return new Response(
    JSON.stringify(
      {
        bearer: bearerResult,
        x_auth_token_with_client_id: customResult,
      },
      null,
      2
    ),
    { status: 200, headers: { "content-type": "application/json" } }
  );
};

export const onRequest = async (): Promise<Response> =>
  new Response(
    JSON.stringify({ error: "method_not_allowed", detail: "GET only" }),
    { status: 405, headers: { "content-type": "application/json" } }
  );
