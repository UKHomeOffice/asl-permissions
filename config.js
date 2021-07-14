module.exports = {
  port: process.env.PORT || 8080,
  cache: process.env.CACHE_TTL,
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
  },
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
      delete: ['asru:*', 'establishment:admin'],
      relatedTasks: ['asru:*', 'establishment:admin']
    },
    profile: {
      invite: ['establishment:admin', 'asru:*'],
      read: {
        all: ['asru:*', 'establishment:admin', 'establishment:read', 'establishment:role:ntco'],
        allCsv: ['asru:*', 'establishment:admin'],
        basic: ['asru:*', 'establishment:*']
      },
      global: ['asru:*', 'profile:own'],
      update: ['profile:own'],
      permissions: ['asru:*', 'establishment:admin'],
      removePermissions: ['asru:*', 'establishment:admin', 'profile:own'],
      roles: ['asru:*', 'establishment:admin'],
      relatedTasks: ['asru:*', 'establishment:admin', 'profile:own']
    },
    training: {
      read: ['asru:*', 'profile:own', 'establishment:admin', 'establishment:read', 'establishment:role:ntco', 'project:collaborator:edit'],
      update: ['asru:*', 'profile:own', 'establishment:admin', 'establishment:role:ntco']
    },
    trainingCourse: {
      read: ['asru:*', 'establishment:admin', 'establishment:read', 'establishment:role:ntco'],
      update: ['asru:*', 'establishment:admin', 'establishment:role:ntco'],
      relatedTasks: ['asru:*', 'establishment:admin', 'establishment:role:ntco']
    },
    pil: {
      list: ['asru:*', 'establishment:admin', 'establishment:read', 'establishment:role:ntco'],
      read: ['pil:own', 'asru:*', 'establishment:admin', 'establishment:read', 'establishment:role:ntco'],
      readCombinedPil: ['profile:own', 'asru:*', 'establishment:admin', 'establishment:read', 'establishment:role:ntco'],
      pdf: ['profile:own', 'asru:*', 'establishment:admin', 'establishment:read', 'establishment:role:ntco'],
      create: ['profile:own', 'establishment:admin'],
      update: ['pil:own', 'holdingEstablishment:admin', 'asru:*'],
      delete: ['pil:own', 'holdingEstablishment:admin'],
      review: ['establishment:role:ntco'],
      transfer: ['pil:own', 'asru:*'],
      updateConditions: ['asru:*'],
      updateBillable: ['asru:support'],
      relatedTasks: ['profile:own', 'holdingEstablishment:admin', 'asru:*']
    },
    project: {
      read: {
        all: ['asru:*', 'establishment:admin', 'establishment:read'],
        basic: ['asru:*', 'establishment:*'],
        single: ['asru:*', 'holdingEstablishment:admin', 'holdingEstablishment:read', 'additionalEstablishment:admin', 'additionalEstablishment:read', 'project:own', 'project:collaborator']
      },
      manageAccess: ['holdingEstablishment:admin', 'project:own', 'asru:inspector', 'additionalEstablishment:admin'],
      transfer: ['project:own', 'asru:inspector'],
      import: ['establishment:*'],
      create: ['profile:own', 'establishment:admin'],
      update: ['holdingEstablishment:admin', 'project:own', 'asru:inspector', 'project:collaborator:edit'],
      submit: ['holdingEstablishment:admin', 'project:own', 'asru:inspector'],
      rops: {
        update: ['establishment:admin', 'project:own', 'asru:inspector', 'project:collaborator:edit'],
        submit: ['establishment:admin', 'project:own', 'asru:inspector'],
        create: ['asru:inspector']
      },
      endorse: ['holdingEstablishment:admin'],
      updateConditions: ['asru:*'],
      updateIssueDate: ['asru:inspector'],
      updateLicenceNumber: ['asru:inspector'],
      delete: ['holdingEstablishment:admin', 'project:own', 'asru:inspector'],
      revoke: ['asru:inspector', 'holdingEstablishment:admin', 'project:own'],
      stub: {
        create: ['asru:*'],
        update: ['asru:*'],
        convert: ['asru:inspector']
      },
      relatedTasks: ['holdingEstablishment:admin', 'project:own', 'asru:*'],
      recoverTask: ['asru:admin']
    },
    projectVersion: {
      read: ['asru:*', 'holdingEstablishment:admin', 'holdingEstablishment:read', 'project:own', 'additionalEstablishment:admin', 'additionalEstablishment:read', 'receivingEstablishment:admin', 'projectVersion:collaborator']
    },
    retrospectiveAssessment: {
      read: ['asru:*', 'holdingEstablishment:admin', 'holdingEstablishment:read', 'project:own', 'additionalEstablishment:admin', 'additionalEstablishment:read', 'receivingEstablishment:admin', 'projectVersion:collaborator'],
      update: ['holdingEstablishment:admin', 'project:own', 'asru:inspector', 'project:collaborator:edit'],
      submit: ['holdingEstablishment:admin', 'project:own', 'asru:inspector']
    },
    establishment: {
      read: ['asru:*', 'establishment:*'],
      pdf: ['asru:*', 'establishment:admin', 'establishment:read'],
      list: ['asru:*'],
      update: ['asru:*', 'establishment:admin'],
      updateConditions: ['asru:*'],
      create: ['asru:*'],
      licenceFees: ['establishment:admin', 'asru:*'],
      rops: ['asru:*'],
      sharedKey: ['asru:*'],
      revoke: ['asru:inspector'],
      relatedTasks: ['asru:*', 'establishment:admin']
    },
    asruProfile: ['*'],
    licenceFees: ['asru:*'],
    asruReporting: ['asru:*'],
    asruRops: ['asru:rops']
  }
};
