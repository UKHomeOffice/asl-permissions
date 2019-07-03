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
      read: ['asru:*', 'establishment:admin', 'establishment:read'],
      create: ['establishment:admin'],
      update: ['establishment:admin'],
      delete: ['establishment:admin']
    },
    profile: {
      invite: ['establishment:admin'],
      read: {
        all: ['asru:*', 'establishment:admin', 'establishment:read'],
        basic: ['asru:*', 'establishment:*']
      },
      update: ['profile:own'],
      permissions: ['establishment:admin'],
      roles: ['establishment:admin']
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
      updateConditions: ['asru:*']
    },
    establishment: {
      read: ['asru:*', 'establishment:*'],
      list: ['asru:*'],
      update: ['establishment:admin'],
      updateConditions: ['asru:*']
    }
  }
};
