// Cloudflare Pages Function - QF token exchange proxy
//
// Why this file exists: Quran Foundation registers API clients with
// token_endpoint_auth_method=client_secret_basic by default, meaning the
// token exchange requires an HTTP Basic auth header carrying a client
// secret. Siraj Noor is a static SPA - we cannot ship a secret to the
// browser bundle. This proxy runs on the Cloudflare Pages edge, reads the
// secret from runtime env, builds the Basic auth header, and forwards the
// PKCE code exchange to QF on the user's behalf.
//
// The browser posts JSON { code, code_verifier, redirect_uri }. The proxy
// translates that into the form-encoded POST QF expects, adds Authorization
// header, forwards, and streams the token response back to the browser
// unchanged.

// No import of PagesFunction - Cloudflare Pages recognises the onRequestPost
// export by name, not by type, and importing PagesFunction<Env> pulls in
// Cloudflare's Response type which conflicts with the DOM Response we use
// throughout the Next.js project. Plain function signatures keep the two
// type worlds isolated.

interface Env {
  QF_CLIENT_ID: string;
  QF_CLIENT_SECRET: string;
  QF_TOKEN_ENDPOINT?: string;
}

interface EventContext {
  request: Request;
  env: Env;
}

interface TokenRequestBody {
  code?: unknown;
  code_verifier?: unknown;
  redirect_uri?: unknown;
}

const DEFAULT_TOKEN_ENDPOINT =
  "https://prelive-oauth2.quran.foundation/oauth2/token";

// Allowlist of origins permitted to use this proxy. Without this check the
// Pages Function is effectively an open OAuth relay - any site on the
// internet could POST a stolen PKCE code and have the confidential client
// secret attached for them. Matched byte-for-byte against the request
// Origin; requests with no Origin header are rejected.
const ALLOWED_ORIGINS = new Set([
  "https://siraj-noor.pages.dev",
  "http://localhost:3000",
  "http://localhost:3001",
]);

// Cap request size so an attacker can't tie up a Worker invocation by
// streaming a huge body. Real PKCE token-exchange bodies are well under
// 1 KB (code_verifier is max 128 chars per RFC 7636).
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
  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
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

  let payload: TokenRequestBody;
  try {
    payload = (await request.json()) as TokenRequestBody;
  } catch {
    return jsonError(400, "invalid_request", "Request body must be JSON.");
  }

  if (
    !isNonEmptyString(payload.code) ||
    !isNonEmptyString(payload.code_verifier) ||
    !isNonEmptyString(payload.redirect_uri)
  ) {
    return jsonError(
      400,
      "invalid_request",
      "code, code_verifier, and redirect_uri are all required."
    );
  }

  const form = new URLSearchParams({
    grant_type: "authorization_code",
    code: payload.code,
    code_verifier: payload.code_verifier,
    redirect_uri: payload.redirect_uri,
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

  // Pass through status and body verbatim so the browser sees the real
  // OAuth error semantics (invalid_grant, etc.) without us inventing our
  // own error shape.
  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
};

// Block non-POST traffic so this can't be used for accidental GETs
export const onRequest = async (): Promise<Response> =>
  jsonError(405, "method_not_allowed", "POST only.");
