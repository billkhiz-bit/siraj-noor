// Cloudflare Pages Function - QF refresh token proxy
//
// Mirrors functions/api/qf/token.ts for the refresh_token grant. Same reason:
// our client is confidential and we can't send client_secret from the
// browser. This function holds the secret server-side and forwards refresh
// requests to QF.

// No PagesFunction import - see functions/api/qf/token.ts for rationale.

interface Env {
  QF_CLIENT_ID: string;
  QF_CLIENT_SECRET: string;
  QF_TOKEN_ENDPOINT?: string;
  QF_ALLOW_DEV_ORIGINS?: string;
}

interface EventContext {
  request: Request;
  env: Env;
}

interface RefreshRequestBody {
  refresh_token?: unknown;
}

const DEFAULT_TOKEN_ENDPOINT =
  "https://prelive-oauth2.quran.foundation/oauth2/token";

// Same Origin allowlist as token.ts. Refresh proxy is even more sensitive
// than token exchange: an attacker with a stolen refresh_token plus an
// open proxy can mint fresh access tokens indefinitely. Localhost is
// gated on QF_ALLOW_DEV_ORIGINS so prod deploys reject dev origins.
function buildAllowedOrigins(env: Env): Set<string> {
  const origins = new Set<string>(["https://siraj-noor.pages.dev"]);
  if (env.QF_ALLOW_DEV_ORIGINS === "true") {
    origins.add("http://localhost:3000");
    origins.add("http://localhost:3001");
  }
  return origins;
}

const MAX_BODY_BYTES = 4096;

function jsonError(
  status: number,
  error: string,
  description: string
): Response {
  return new Response(
    JSON.stringify({ error, error_description: description }),
    {
      status,
      headers: { "content-type": "application/json" },
    }
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export const onRequestPost = async ({
  request,
  env,
}: EventContext): Promise<Response> => {
  const origin = request.headers.get("origin");
  if (!origin || !buildAllowedOrigins(env).has(origin)) {
    return jsonError(
      403,
      "forbidden_origin",
      "This proxy only accepts requests from the registered Siraj Noor origin."
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return jsonError(
      413,
      "payload_too_large",
      `Request body exceeds ${MAX_BODY_BYTES} bytes.`
    );
  }

  if (!env.QF_CLIENT_ID || !env.QF_CLIENT_SECRET) {
    return jsonError(
      500,
      "proxy_misconfigured",
      "QF_CLIENT_ID or QF_CLIENT_SECRET is not set on this Pages deployment."
    );
  }

  let payload: RefreshRequestBody;
  try {
    payload = (await request.json()) as RefreshRequestBody;
  } catch {
    return jsonError(400, "invalid_request", "Request body must be JSON.");
  }

  if (!isNonEmptyString(payload.refresh_token)) {
    return jsonError(
      400,
      "invalid_request",
      "refresh_token is required."
    );
  }

  const form = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: payload.refresh_token,
  });

  const basic = btoa(`${env.QF_CLIENT_ID}:${env.QF_CLIENT_SECRET}`);
  const tokenEndpoint = env.QF_TOKEN_ENDPOINT ?? DEFAULT_TOKEN_ENDPOINT;

  let upstream: Response;
  try {
    upstream = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: `Basic ${basic}`,
      },
      body: form.toString(),
    });
  } catch {
    return jsonError(
      502,
      "upstream_unreachable",
      "Could not reach the Quran Foundation token endpoint."
    );
  }

  // Same content-type guard as token.ts - only forward JSON bodies so
  // Hydra HTML stack traces / 5xx pages don't leak through as JSON.
  const body = await upstream.text();
  const upstreamContentType = upstream.headers.get("content-type") ?? "";
  const looksLikeJson = upstreamContentType.includes("application/json");
  if (!looksLikeJson) {
    return jsonError(
      upstream.ok ? 502 : upstream.status,
      "upstream_error",
      `Quran Foundation returned a non-JSON response (status ${upstream.status}).`
    );
  }
  return new Response(body, {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
};

export const onRequest = async (): Promise<Response> =>
  jsonError(405, "method_not_allowed", "POST only.");
