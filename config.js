module.exports = {
  port: process.env.PORT || 8080,
  auth: {
    realm: process.env.KEYCLOAK_REALM,
    url: process.env.KEYCLOAK_URL,
    client: process.env.KEYCLOAK_CLIENT,
    secret: process.env.KEYCLOAK_SECRET
  },
  permissions: {
    place: {
      create: ['inspector', 'owner'],
      update: ['inspector', 'owner'],
      delete: ['inspector', 'owner']
    },
    project: {
      read: ['inspector', 'owner'],
      list: ['inspector', 'owner']
    },
    establishment: {
      read: ['inspector', 'owner'],
      list: ['inspector']
    }
  }
};
