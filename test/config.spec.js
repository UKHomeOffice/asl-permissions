const assert = require('assert');

const { get } = require('lodash');
const { permissions } = require('../config');
const { externalPermissions, roles } = require('@asl/constants');
const { traverse } = require('../lib/utils');

describe('Task configuration', () => {

  const tasks = traverse(permissions);

  tasks.forEach(task => {
    it(`${task}: only has pre-defined establishment permissions`, () => {
      const permissionTypes = get(permissions, task);
      permissionTypes.forEach(type => {
        if (type.match(/^establishment:(.*)$/)) {
          const level = type.split(':')[1];
          if (level === 'role') {
            const roleType = type.split(':')[2];
            assert.ok([ ...roles, '*' ].includes(roleType), `${roleType} should be included in defined roles`);
          } else {
            assert.ok([ ...externalPermissions, '*' ].includes(level), `${level} should be included in defined permissions levels`);
          }
        }
      });
    });
  });

});
