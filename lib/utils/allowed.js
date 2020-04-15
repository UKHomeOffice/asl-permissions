const { some } = require('lodash');
const { ref } = require('objection');

function filterUserRolesByEstablishment(user, establishmentId) {
  establishmentId = parseInt(establishmentId, 10);
  const roles = (user.roles || []).filter(role => role.establishmentId === establishmentId);
  const establishment = (user.establishments || []).find(e => e.id === establishmentId) || {};
  const permissionLevel = establishment.role;

  return { ...user, roles, permissionLevel };
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
    .then(() => {
      if (permission === '*') {
        return true;
      }
      const pieces = permission.split(':');
      const scope = pieces[0];
      const level = pieces[1];

      const user = filterUserRolesByEstablishment(unscoped, subject.establishment);

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
      if (scope === 'pil' && level === 'own' && subject.pilId) {
        const { PIL } = db;
        return Promise.resolve()
          .then(() => PIL.queryWithDeleted().findById(subject.pilId).select('profileId'))
          .then(result => user.id === result.profileId);
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
          .then(() => Project.queryWithDeleted().whereIsCollaborator(user.id).findById(id).select('id', 'establishmentId'))
          .then(project => {
            if (!project) {
              return false;
            }
            // check the user is affiliated to project-holding establishment
            return Promise.resolve()
              .then(() => Profile.query().findById(user.id).leftJoinRelation('establishments').where('establishments.id', project.establishmentId).select('id'))
              .then(profile => !!profile);
          });
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

module.exports = ({ db }) => ({ model, permissions, user = {}, subject = {}, log }) => {
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
