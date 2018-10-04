const { get } = require('lodash');
const { traverse, allowed } = require('./utils');

module.exports = permissions => {
  const tasks = traverse(permissions);

  return user => {
    const establishmentPermissions = user.establishments.reduce((obj, e) => {
      return {
        ...obj,
        [e.id]: tasks.filter(task => {
          return allowed({
            roles: get(permissions, task),
            user: {
              ...user,
              role: e.role
            }
          });
        })
      };
    }, {});
    const globalPermissions = tasks.filter(task => {
      return allowed({
        roles: get(permissions, task),
        user
      });
    });
    return {
      ...establishmentPermissions,
      global: globalPermissions
    };
  };
};