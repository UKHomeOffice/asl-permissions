const { some } = require('lodash');

module.exports = ({ roles, user, subject }) => {
  return some(roles, role => {
    if (role === '*') {
      return true;
    }
    const scope = role.split(':')[0];
    const level = role.split(':')[1];
    if (scope === 'establishment' && user.role) {
      return level === '*' || user.role === level;
    }
    if (scope === 'profile' && level === 'own') {
      return user.id && user.id === subject.id;
    }
  });
};
