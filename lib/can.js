const { get, some } = require('lodash');

const can = (permissions, db) => (profile, task, params) => {
  if (!profile) {
    const err = new Error('Unknown user');
    err.status = 400;
    return Promise.reject(err);
  }

  const settings = get(permissions, task);
  if (!settings) {
    const err = new Error(`Unknown task: ${task}`);
    err.status = 404;
    return Promise.reject(err);
  }

  const establishment = (profile.establishments || []).find(e => e.id === params.establishment);

  return Promise.resolve()
    .then(() => {
      return some(settings, role => {
        const scope = role.split(':')[0];
        const level = role.split(':')[1];
        if (scope === 'establishment' && establishment) {
          return level === '*' || establishment.permission.role === level;
        }
      });
    });

};

module.exports = can;
