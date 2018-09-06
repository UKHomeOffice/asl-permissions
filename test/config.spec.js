const assert = require('assert');

const { get } = require('lodash');
const { permissions } = require('../config');
const { externalPermissions } = require('@asl/constants');
const { traverse } = require('../lib/utils');

describe('Task configuration', () => {

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
