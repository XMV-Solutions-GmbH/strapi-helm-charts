// SPDX-License-Identifier: Apache-2.0
//
// Strapi server runtime config. Env-driven so the same image works
// behind a reverse proxy (production) and standalone (local dev).

export default ({ env }: { env: any }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),

  // Public URL Strapi advertises in admin links + the SSO redirect_uri
  // it computes. Must match the host the operator actually visits.
  url: env('URL', undefined),

  // PROXY_ENABLED=true tells Strapi to trust X-Forwarded-* headers from
  // the reverse proxy in front of it (ingress-nginx, Cloudflare, …). Without
  // it Strapi sees the inbound HTTP from the proxy as "insecure" and refuses
  // to set Secure cookies — admin login + SSO callback both fail with
  // "Cannot send secure cookie over unencrypted connection".
  proxy: env.bool('PROXY_ENABLED', false),

  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
