const assert = require('assert');

const { flatten, get } = require('lodash');
const { permissions } = require('../config');
const { externalPermissions } = require('@asl/constants');

describe('Task configuration', () => {

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

  const tasks = traverse(permissions);

  tasks.forEach(task => {
    it(`${task}: only has pre-defined establishment permissions`, () => {
      const roles = get(permissions, task);
      roles.forEach(role => {
        if (role.match(/^estabishment:(.*)$/)) {
          const type = role.split(':')[1];
          assert.ok(externalPermissions.includes(type), `${type} is included in external permissions allowed roles`);
        }
      });
    });
  });

});
