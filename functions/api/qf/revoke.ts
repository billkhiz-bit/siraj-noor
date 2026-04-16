// Cloudflare Pages Function — QF token revocation proxy
//
// Hydra's /oauth2/revoke endpoint requires the same confidential
// client authentication as /oauth2/token (client_secret_basic), so
// revocation has to go through a proxy for the same reason as token
// exchange and refresh. The endpoint is RFC 7009 — POST the token to
// be revoked with the client's Basic auth header, server responds 200
// whether the token was active or already revoked.
//
// This is called during logout *before* the browser redirects to
// Hydra's session logout. Clearing the refresh_token server-side is
// what actually ends the grant — without this, a compromised refresh
// token could mint new access tokens long after the user signed out.

interface Env {
  QF_CLIENT_ID: string;
  QF_CLIENT_SECRET: string;
  QF_REVOKE_ENDPOINT?: string;
}

interface EventContext {
  request: Request;
  env: Env;
}

interface RevokeRequestBody {
  token?: unknown;
  token_type_hint?: unknown;
}

const DEFAULT_REVOKE_ENDPOINT =
  "https://prelive-oauth2.quran.foundation/oauth2/revoke";

const ALLOWED_ORIGINS = new Set([
  "https://siraj-noor.pages.dev",
  "http://localhost:3000",
  "http://localhost:3001",
]);

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

  let payload: RevokeRequestBody;
  try {
    payload = (await request.json()) as RevokeRequestBody;
  } catch {
    return jsonError(400, "invalid_request", "Request body must be JSON.");
  }

  if (!isNonEmptyString(payload.token)) {
    return jsonError(400, "invalid_request", "token is required.");
  }

  const form = new URLSearchParams({ token: payload.token });
  if (isNonEmptyString(payload.token_type_hint)) {
    form.set("token_type_hint", payload.token_type_hint);
  }

  const basic = btoa(`${env.QF_CLIENT_ID}:${env.QF_CLIENT_SECRET}`);
  const revokeEndpoint = env.QF_REVOKE_ENDPOINT ?? DEFAULT_REVOKE_ENDPOINT;

  try {
    await fetch(revokeEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: `Basic ${basic}`,
      },
      body: form.toString(),
    });
  } catch {
    // Revocation failures are not user-actionable — log-and-forget.
    // The local token clear in the browser has already happened; at
    // worst the refresh_token remains live on QF's side until it
    // expires naturally. Not ideal, but not a credential leak either.
  }

  // RFC 7009: always 200 on revoke — the caller can't distinguish
  // "revoked" from "was already revoked" from "didn't exist" by design.
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const onRequest = async (): Promise<Response> =>
  jsonError(405, "method_not_allowed", "POST only.");
