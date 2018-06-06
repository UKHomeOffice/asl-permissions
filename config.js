module.exports = {
  port: process.env.PORT || 8080,
  auth: {
    realm: process.env.KEYCLOAK_REALM,
    url: process.env.KEYCLOAK_URL,
    client: process.env.KEYCLOAK_CLIENT,
    secret: process.env.KEYCLOAK_SECRET
  },
  permissions: {
    project: {
      read: {
        roles: ['inspector', 'owner']
      },
      list: {
        roles: ['inspector', 'owner']
      }
    },
    establishment: {
      read: {
        roles: ['inspector', 'owner']
      },
      list: {
        roles: ['inspector']
      }
    }
  }
};
