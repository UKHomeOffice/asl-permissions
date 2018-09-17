const { some } = require('lodash');

module.exports = ({ roles, userRole, userId, id }) => {
  return some(roles, role => {
    if (role === '*') {
      return true;
    }
    const scope = role.split(':')[0];
    const level = role.split(':')[1];
    if (scope === 'establishment' && userRole) {
      return level === '*' || userRole === level;
    }
    if (scope === 'profile' && level === 'own') {
      return userId === id;
    }
  });
};
