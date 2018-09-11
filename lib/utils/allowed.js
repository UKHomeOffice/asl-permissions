const { some } = require('lodash');

module.exports = (roles, userRole) => {
  return some(roles, role => {
    if (role === '*') {
      return true;
    }
    const scope = role.split(':')[0];
    const level = role.split(':')[1];
    if (scope === 'establishment' && userRole) {
      return level === '*' || userRole === level;
    }
  });
};
