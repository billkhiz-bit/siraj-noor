// Diagnostic-only proxy for the 2026-04-15 Origin-header hypothesis test.
// Forwards exactly Basit's repro URL server-side on Cloudflare Workers.
// Probe 11 on /debug/auth calls this; if server-side succeeds where
// browser fetch fails, the gateway is rejecting our browser Origin header.
// Delete once the investigation is resolved.

interface EventContext {
  request: Request;
}

const TARGET_URL =
  "https://apis-prelive.quran.foundation/auth/v1/bookmarks?mushafId=4&first=1";

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

  let upstream: Response;
  try {
    upstream = await fetch(TARGET_URL, {
      headers: {
        "x-auth-token": token,
        "x-client-id": clientId,
      },
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
