const { some } = require('lodash');

function filterUserRolesByEstablishment(user, establishmentId) {
  establishmentId = parseInt(establishmentId, 10);
  const roles = (user.roles || []).filter(role => role.establishmentId === establishmentId);
  const establishment = (user.establishments || []).find(e => e.id === establishmentId) || {};
  const role = establishment.role;

  return { ...user, roles, role };
}

function roleIsAllowed({ db, model, role, user: unscoped, subject }) {
  return Promise.resolve()
    .then(() => {
      if (role === '*') {
        return true;
      }
      const pieces = role.split(':');
      const scope = pieces[0];
      const level = pieces[1];

      const user = filterUserRolesByEstablishment(unscoped, subject.establishment);

      if (scope === 'establishment' && level === 'role') {
        const roleType = pieces[2];
        return user.roles && user.roles.find(r => r.type === roleType);
      }
      if (scope === 'establishment' && user.role) {
        return level === '*' || user.role === level;
      }
      if (scope === 'holdingEstablishment') {
        if (model === 'pil') {
          const { PIL } = db;
          return Promise.resolve()
            .then(() => PIL.query().findById(subject.pilId).select('establishmentId'))
            .then(establishment => {
              const scopedUser = filterUserRolesByEstablishment(unscoped, establishment.id);
              return scopedUser.role && (level === '*' || scopedUser.role === level);
            });
        }
        return false;
      }
      if (scope === 'profile' && level === 'own') {
        return user.id && (user.id === subject.profileId || user.id === subject.id);
      }
      if (scope === 'project' && level === 'own') {
        return user.id && user.id === subject.licenceHolderId;
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

module.exports = ({ db }) => ({ model, roles, user = {}, subject = {} }) => {
  return Promise.all(
    roles.map(role => roleIsAllowed({ db, model, role, user, subject }))
  )
    .then(some);
};
