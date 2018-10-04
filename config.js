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
      update: ['profile:own']
    },
    project: {
      read: {
        all: ['asru:*', 'establishment:admin', 'establishment:read'],
        basic: ['asru:*', 'establishment:*']
      }
    },
    establishment: {
      read: ['asru:*', 'establishment:*'],
      list: ['asru:*']
    }
  }
};
