// SPDX-License-Identifier: Apache-2.0
//
// All plugins shipped by this base image are configured purely from
// environment variables so the image stays generic — the same artefact
// can serve a deployment that uses local-fs uploads + no SSO, AND a
// deployment that uses S3 + Azure-AD SSO, without rebuilding.
//
// Adding a new plugin to this file: install it via `npm install
// <plugin>` in image/package.json, then add a block here that returns
// `enabled: false` (or `{}`) when its activation env var is missing.
// Never enable a plugin that requires credentials it doesn't have —
// surfacing a "configuration is required" error on container boot is
// far worse than silently leaving the feature off.

interface PluginConfig {
  enabled: boolean;
  config?: Record<string, unknown>;
  resolve?: string;
}

export default ({ env }: { env: any }): Record<string, PluginConfig> => {
  const plugins: Record<string, PluginConfig> = {};

  // ────────────────────────────────────────────────────────────────────────
  // upload — S3-compatible object storage (default: local-fs)
  // ────────────────────────────────────────────────────────────────────────
  if (env('UPLOAD_PROVIDER', 'local') === 'aws-s3') {
    plugins.upload = {
      enabled: true,
      config: {
        provider: 'aws-s3',
        providerOptions: {
          credentials: {
            accessKeyId: env('S3_ACCESS_KEY_ID'),
            secretAccessKey: env('S3_SECRET_ACCESS_KEY'),
          },
          region: env('S3_REGION', 'us-east-1'),
          params: {
            Bucket: env('S3_BUCKET', 'strapi-media'),
          },
          ...(env('S3_ENDPOINT')
            ? {
                endpoint: env('S3_ENDPOINT'),
                forcePathStyle: true,
              }
            : {}),
        },
        actionOptions: {
          upload: {},
          uploadStream: {},
          delete: {},
        },
      },
    };
  }

  // ────────────────────────────────────────────────────────────────────────
  // strapi-plugin-sso — admin-panel SSO (Google / Azure AD / Cognito / OIDC)
  //
  // Off by default. To activate Azure AD (Microsoft Entra), set:
  //   STRAPI_SSO_ENABLED=true
  //   AZUREAD_OAUTH_CLIENT_ID=<entra app reg client id>
  //   AZUREAD_OAUTH_CLIENT_SECRET=<entra app reg client secret>
  //   AZUREAD_TENANT_ID=<entra tenant id>
  //   AZUREAD_OAUTH_REDIRECT_URI=https://<your-cms-host>/strapi-plugin-sso/azuread/callback
  //   AZUREAD_SCOPE="openid profile email"  (default)
  //
  // The plugin sticks to its DB-backed role mapping for first-time SSO
  // logins — configure under Settings → strapi-plugin-sso once an admin
  // user exists. If the email exists already (e.g. provisioned via the
  // STRAPI_BOOTSTRAP_SUPERADMIN_* mechanism in src/index.ts), the
  // existing role assignment is preserved.
  // ────────────────────────────────────────────────────────────────────────
  if (env.bool('STRAPI_SSO_ENABLED', false)) {
    plugins['strapi-plugin-sso'] = {
      enabled: true,
      config: {
        AZUREAD_OAUTH_REDIRECT_URI: env('AZUREAD_OAUTH_REDIRECT_URI', ''),
        AZUREAD_TENANT_ID: env('AZUREAD_TENANT_ID', ''),
        AZUREAD_OAUTH_CLIENT_ID: env('AZUREAD_OAUTH_CLIENT_ID', ''),
        AZUREAD_OAUTH_CLIENT_SECRET: env('AZUREAD_OAUTH_CLIENT_SECRET', ''),
        AZUREAD_SCOPE: env('AZUREAD_SCOPE', 'openid profile email'),
      },
    };
  }

  return plugins;
};
