const { some } = require('lodash');
const { ref } = require('objection');

function filterUserRolesByEstablishment(user, establishmentId) {
  establishmentId = parseInt(establishmentId, 10);
  const roles = (user.roles || []).filter(role => role.establishmentId === establishmentId);
  const establishment = (user.establishments || []).find(e => e.id === establishmentId) || {};
  const permissionLevel = establishment.role;

  return { ...user, roles, permissionLevel };
}

function userIsBlockedAtEstablishment(user, establishmentId) {
  establishmentId = parseInt(establishmentId, 10);
  const establishment = (user.establishments || []).find(e => e.id === establishmentId) || {};
  return establishment.role === 'blocked';
}

function scopedUserHasPermission(Model, id, user, level) {
  if (!id) {
    return Promise.resolve(false);
  }
  return Promise.resolve()
    .then(() => Model.queryWithDeleted().findById(id).select('establishmentId'))
    .then(result => {
      if (!result) {
        return false;
      }
      const scopedUser = filterUserRolesByEstablishment(user, result.establishmentId);
      return scopedUser.permissionLevel && (level === '*' || scopedUser.permissionLevel === level);
    });
}

function roleIsAllowed({ db, model, permission, user: unscoped, subject = {} }) {
  return Promise.resolve()
    .then(async () => {
      if (permission === '*') {
        return true;
      }
      const pieces = permission.split(':');
      const scope = pieces[0];
      const level = pieces[1];

      subject.establishment = subject.establishment || subject.establishmentId;
      const user = filterUserRolesByEstablishment(unscoped, subject.establishment);
      async function hasAdditionalAvailability() {
        const id = subject.projectId || subject.id;

        if (!id) {
          return false;
        }

        const projectEstablishments = await db.ProjectEstablishment.query().where({ projectId: id });

        return some(projectEstablishments, pe => {
          if (parseInt(subject.establishment, 10) !== pe.establishmentId) {
            return false;
          }
          return filterUserRolesByEstablishment(unscoped, pe.establishmentId).permissionLevel === level;
        });
      }

      async function canViewVersion() {
        const establishmentId = parseInt(subject.establishment, 10);
        const project = await db.Project.query().findById(subject.projectId);
        const projectEstablishment = await db.ProjectEstablishment.query()
          .where({ establishmentId, projectId: subject.projectId })
          .first();

        if (!projectEstablishment) {
          return false;
        }

        const wasGranted = ['active', 'expired', 'revoked'].includes(project.status);

        if (projectEstablishment.status === 'draft' && project.status === 'inactive') {
          const mostRecentVersion = await db.ProjectVersion.query()
            .where({ projectId: subject.projectId })
            .orderBy('createdAt', 'desc')
            .first()
            .select('id');

          return mostRecentVersion && mostRecentVersion.id === subject.versionId;
        }

        if (projectEstablishment.status === 'active' && wasGranted) {
          const mostRecentGrantedVersion = await db.ProjectVersion.query()
            .where({ projectId: subject.projectId, status: 'granted' })
            .orderBy('createdAt', 'desc')
            .first()
            .select('id');

          return mostRecentGrantedVersion && mostRecentGrantedVersion.id === subject.versionId;
        }

        if (projectEstablishment.status === 'removed' && wasGranted) {
          return projectEstablishment.versionId === subject.versionId;
        }

        return false;
      }

      if (scope === 'establishment' && level === 'role') {
        const roleType = pieces[2];
        return user.roles && user.roles.find(r => r.type === roleType);
      }
      if (scope === 'establishment' && user.permissionLevel) {
        return level === '*' || user.permissionLevel === level;
      }
      if (scope === 'receivingEstablishment') {
        if (model === 'projectVersion') {
          const id = subject.versionId;
          if (!id) {
            return false;
          }
          return Promise.resolve()
            .then(() => db.ProjectVersion.queryWithDeleted().findById(id).select(
              ref('data:transferToEstablishment')
                .castInt()
                .as('transferToEstablishment')
            ))
            .then(version => {
              if (!version.transferToEstablishment) {
                return false;
              }
              const scopedUser = filterUserRolesByEstablishment(unscoped, version.transferToEstablishment);
              return scopedUser.permissionLevel && (level === '*' || scopedUser.permissionLevel === level);
            });
        }

        return false;
      }
      if (scope === 'holdingEstablishment') {
        if (model === 'pil') {
          const id = subject.pilId || subject.id;
          return scopedUserHasPermission(db.PIL, id, unscoped, level);
        }
        if (model === 'project' || model === 'projectVersion') {
          const id = subject.projectId || subject.id;
          return scopedUserHasPermission(db.Project, id, unscoped, level);
        }
        return false;
      }
      if (scope === 'additionalEstablishment') {
        if (model === 'project') {
          return hasAdditionalAvailability();
        }
        if (model === 'projectVersion') {
          return Promise.resolve()
            .then(() => hasAdditionalAvailability())
            .then(isAllowed => isAllowed && canViewVersion());
        }
        return false;
      }
      if (scope === 'pil' && level === 'own') {
        const id = subject.pilId || subject.id;
        if (id) {
          const { PIL } = db;
          return Promise.resolve()
            .then(() => PIL.queryWithDeleted().findById(id).select('profileId'))
            .then(result => result && user.id === result.profileId);
        }
      }
      if (scope === 'profile' && level === 'own') {
        const id = subject.profileId || subject.id;
        return user.id && user.id === id;
      }
      if (scope === 'project' && level === 'collaborator') {
        const id = subject.projectId || subject.id;
        if (!id) {
          return false;
        }
        const { Project, Profile } = db;
        return Promise.resolve()
          .then(() => Project.queryWithDeleted()
            .whereIsCollaborator(user.id)
            .withGraphFetched('additionalEstablishments')
            .findById(id)
            .select('id', 'establishmentId')
          )
          .then(project => {
            if (!project) {
              return false;
            }

            // check the user is affiliated to project-holding establishment, or additional availability establishment
            return Promise.resolve()
              .then(() => Profile.query()
                .findById(user.id)
                .leftJoinRelated('establishments')
                .withGraphFetched('establishments')
                .whereIn('establishments.id', [project.establishmentId, ...(project.additionalEstablishments || []).map(e => e.id)])
                .select('profiles.id'))
              .then(profile => !!profile);
          });
      }
      if (scope === 'projectVersion' && level === 'collaborator') {
        if (!subject.projectId) {
          return false;
        }

        const project = await db.Project.queryWithDeleted()
          .whereIsCollaborator(user.id)
          .findById(subject.projectId)
          .select('id', 'establishmentId');

        if (!project) {
          return false;
        }

        const establishmentId = parseInt(subject.establishment, 10);

        if (establishmentId === project.establishmentId) {
          const profile = db.Profile.query()
            .findById(user.id)
            .leftJoinRelated('establishments')
            .where('id', project.establishmentId);

          return !!profile;
        }

        return canViewVersion();
      }
      if (scope === 'project' && level === 'own') {
        const id = subject.projectId || subject.id;
        if (!id) {
          return false;
        }
        const { Project } = db;
        return Promise.resolve()
          .then(() => Project.queryWithDeleted().findById(id).select('licenceHolderId'))
          .then(result => user.id === result.licenceHolderId);
      }
      if (scope === 'asru' && user.asruUser) {
        if (level === '*') {
          return true;
        }
        const key = `asru${level.charAt(0).toUpperCase()}${level.slice(1)}`;
        return level && user[key];
      }
      return false;
    });
}

module.exports = ({ db }) => ({ model, permissions, user = {}, subject = {}, log = console.log }) => {
  if (subject.establishment && userIsBlockedAtEstablishment(user, subject.establishment)) {
    return Promise.resolve(false);
  }

  const promises = permissions
    .map(permission => {
      return roleIsAllowed({ db, model, permission, user, subject })
        // if a particular permission check errors, don't fail the entire request
        .catch(e => {
          log('error', { message: e.message, stack: e.stack, permission });
          return false;
        });
    });
  return Promise.all(promises).then(some);
};
