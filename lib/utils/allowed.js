const { some } = require('lodash');

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
    .then(() => Model.query().findById(id).select('establishmentId'))
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
      if (scope === 'holdingEstablishment') {
        if (model === 'pil') {
          const id = subject.pilId || subject.id;
          return scopedUserHasPermission(db.PIL, id, unscoped, level);
        }
        if (model === 'project') {
          const id = subject.projectId || subject.id;
          return scopedUserHasPermission(db.Project, id, unscoped, level);
        }
        return false;
      }
      if (scope === 'profile' && level === 'own') {
        return user.id && (user.id === subject.profileId || user.id === subject.id);
      }
      if (scope === 'project' && level === 'own' && subject.projectId) {
        const { Project } = db;
        return Promise.resolve()
          .then(() => Project.query().findById(subject.projectId).select('licenceHolderId'))
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

module.exports = ({ db }) => ({ model, permissions, user = {}, subject = {} }) => {
  return Promise.all(
    permissions.map(permission => roleIsAllowed({ db, model, permission, user, subject }))
  )
    .then(some);
};
