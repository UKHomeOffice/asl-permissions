const { some } = require('lodash');

module.exports = ({ roles, user = {}, subject = {} }) => {
  return some(roles, role => {
    if (role === '*') {
      return true;
    }
    const pieces = role.split(':');
    const scope = pieces[0];
    const level = pieces[1];
    if (scope === 'establishment' && level === 'role') {
      const roleType = pieces[2];
      return user.roles && user.roles.find(r => r.type === roleType);
    }
    if (scope === 'establishment' && user.role) {
      return level === '*' || user.role === level;
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
};
