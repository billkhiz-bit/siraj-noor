// Cloudflare Pages Function — QF refresh token proxy
//
// Mirrors functions/api/qf/token.ts for the refresh_token grant. Same reason:
// our client is confidential and we can't send client_secret from the
// browser. This function holds the secret server-side and forwards refresh
// requests to QF.

// No PagesFunction import — see functions/api/qf/token.ts for rationale.

interface Env {
  QF_CLIENT_ID: string;
  QF_CLIENT_SECRET: string;
  QF_TOKEN_ENDPOINT?: string;
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

  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
};

export const onRequest = async (): Promise<Response> =>
  jsonError(405, "method_not_allowed", "POST only.");
