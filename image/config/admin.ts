export default ({ env }) => ({
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  url: env('PUBLIC_ADMIN_URL', '/admin'),
  flags: {
    nps: false,
    promoteEE: false,
  },
});
