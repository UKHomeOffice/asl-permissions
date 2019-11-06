module.exports = {
  port: process.env.PORT || 8080,
  auth: {
    realm: process.env.KEYCLOAK_REALM,
    url: process.env.KEYCLOAK_URL,
    client: process.env.KEYCLOAK_CLIENT,
    secret: process.env.KEYCLOAK_SECRET
  },
  db: {
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USERNAME || 'postgres'
  },
  permissions: {
    place: {
      list: ['asru:*', 'establishment:admin', 'establishment:read'],
      read: ['asru:*', 'establishment:admin', 'establishment:read'],
      create: ['asru:*', 'establishment:admin'],
      update: ['asru:*', 'establishment:admin'],
      delete: ['asru:*', 'establishment:admin']
    },
    profile: {
      invite: ['establishment:admin', 'asru:*'],
      read: {
        all: ['asru:*', 'establishment:admin', 'establishment:read'],
        basic: ['asru:*', 'establishment:*']
      },
      update: ['profile:own'],
      permissions: ['asru:*', 'establishment:admin'],
      roles: ['asru:*', 'establishment:admin']
    },
    pil: {
      read: ['profile:own', 'asru:*', 'establishment:admin', 'establishment:read'],
      create: ['profile:own', 'establishment:admin'],
      update: ['profile:own', 'establishment:admin', 'asru:*'],
      delete: ['profile:own', 'establishment:admin'],
      updateConditions: ['asru:*']
    },
    project: {
      read: {
        all: ['asru:*', 'establishment:admin', 'establishment:read'],
        basic: ['asru:*', 'establishment:*'],
        single: ['asru:*', 'establishment:admin', 'establishment:read', 'project:own']
      },
      apply: ['establishment:*'],
      update: ['establishment:admin', 'project:own'],
      updateConditions: ['asru:*'],
      delete: ['establishment:admin', 'project:own'],
      revoke: ['asru:*', 'establishment:admin', 'project:own']
    },
    establishment: {
      read: ['asru:*', 'establishment:*'],
      pdf: ['asru:*', 'establishment:admin', 'establishment:read'],
      list: ['asru:*'],
      update: ['asru:*', 'establishment:admin'],
      updateConditions: ['asru:*'],
      create: ['asru:*']
    }
  }
};
