const { get } = require('lodash');
const { allowed } = require('./utils');

const can = permissions => (user, task, params) => {

  const establishment = (user.establishments || []).find(e => e.id === parseInt(params.establishment, 10)) || {};

  if (!user) {
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

  return Promise.resolve()
    .then(() => allowed({
      roles: settings,
      userRole: establishment.role,
      userId: user.id,
      ...params
    }));
};

module.exports = can;
