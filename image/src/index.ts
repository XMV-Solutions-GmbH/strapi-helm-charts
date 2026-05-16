// SPDX-License-Identifier: Apache-2.0
//
// Strapi entry-point hooks. Kept generic so this base image works for
// any deployment; behaviour is driven exclusively by environment vars.

import * as crypto from 'node:crypto';

export default {
  /**
   * register — runs before bootstrap. Used to extend Strapi's core
   * (route registration, custom services). Generic base image has
   * nothing to register; downstream forks add their hooks here.
   */
  register(/* { strapi } */) {},

  /**
   * bootstrap — runs after Strapi is fully initialised but before the
   * HTTP server starts accepting requests. Suitable for one-off DB
   * seeding (e.g. provisioning the first admin user when there is no
   * way for a human to register interactively, like in a fully-
   * automated bootstrap).
   *
   * Env-driven super-admin provisioning:
   *   STRAPI_BOOTSTRAP_SUPERADMIN_EMAIL — when set, this email is
   *     ensured to exist in the admin::user table with the
   *     strapi-super-admin role. Useful for fresh deployments that
   *     plan to authenticate via SSO (the SSO plugin matches on email
   *     and reuses an existing user record).
   *   STRAPI_BOOTSTRAP_SUPERADMIN_FIRSTNAME — defaults to "Bootstrap".
   *   STRAPI_BOOTSTRAP_SUPERADMIN_LASTNAME  — defaults to "Admin".
   *
   * No password is published — a strong random one is generated and
   * discarded. The user is expected to authenticate via SSO. If
   * STRAPI_SSO_ENABLED is false the operator can also reset the
   * password through Strapi's forgot-password flow.
   *
   * Idempotent: if the user already exists, this is a no-op.
   */
  async bootstrap({ strapi }: { strapi: any }) {
    const email = process.env.STRAPI_BOOTSTRAP_SUPERADMIN_EMAIL;
    if (!email) return;

    const existing = await strapi
      .query('admin::user')
      .findOne({ where: { email } });
    if (existing) {
      strapi.log.info(
        `[bootstrap-superadmin] user ${email} already exists — no-op`,
      );
      return;
    }

    const superAdminRole = await strapi
      .query('admin::role')
      .findOne({ where: { code: 'strapi-super-admin' } });
    if (!superAdminRole) {
      strapi.log.warn(
        '[bootstrap-superadmin] strapi-super-admin role missing — Strapi may not be fully initialised yet; skipping',
      );
      return;
    }

    // 64 hex chars = 256 bits of entropy. Bcrypt-hashed by the user
    // service before storage, so the plaintext never persists.
    const throwawayPassword = crypto.randomBytes(32).toString('hex');

    await strapi.service('admin::user').create({
      email,
      username: email,
      firstname: process.env.STRAPI_BOOTSTRAP_SUPERADMIN_FIRSTNAME || 'Bootstrap',
      lastname: process.env.STRAPI_BOOTSTRAP_SUPERADMIN_LASTNAME || 'Admin',
      isActive: true,
      blocked: false,
      password: throwawayPassword,
      registrationToken: null,
      roles: [superAdminRole.id],
    });
    strapi.log.info(
      `[bootstrap-superadmin] provisioned ${email} with strapi-super-admin role (SSO recommended for login)`,
    );
  },
};
