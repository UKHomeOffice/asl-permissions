const { get, some } = require('lodash');

const can = permissions => (user, task, params) => {
  const settings = get(permissions, task);

  if (!settings) {
    return Promise.reject(new Error(`Unknown task: ${task}`));
  }

  const hasRole = role => {
    // "owner" role checks user is associated with the particular establishment
    if (role === 'owner') {
      return user.get('establishment') === params.establishment;
    }
    return user.is(role);
  };

  const userHasRole = some(settings.roles, hasRole);

  return Promise.resolve(userHasRole);
};

module.exports = can;
