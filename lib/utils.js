const { flatten, some } = require('lodash');

const traverse = (obj, prefix = '') => {
  if (Array.isArray(obj) || typeof obj === 'string') {
    return prefix;
  } else {
    const tasks = Object.keys(obj).map(key => {
      return traverse(obj[key], `${prefix}${prefix ? '.' : ''}${key}`);
    });
    return flatten(tasks);
  }
};

const allowed = (roles, userRole) => {
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

module.exports = {
  traverse,
  allowed
};
