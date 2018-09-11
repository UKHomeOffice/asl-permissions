const { flatten } = require('lodash');

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

module.exports = traverse;
