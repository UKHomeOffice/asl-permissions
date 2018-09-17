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
      read: ['establishment:admin', 'establishment:read'],
      create: ['inspector', 'establishment:admin'],
      update: ['inspector', 'establishment:admin'],
      delete: ['inspector', 'establishment:admin']
    },
    profile: {
      invite: ['establishment:admin'],
      read: {
        all: ['establishment:admin', 'establishment:read'],
        basic: ['establishment:*']
      },
      update: ['profile:own']
    },
    project: {
      read: {
        all: ['establishment:admin', 'establishment:read'],
        basic: ['establishment:*']
      }
    },
    establishment: {
      read: ['inspector', 'establishment:*'],
      list: ['inspector']
    }
  }
};
