const { get } = require('lodash');
const { allowed } = require('./utils');

const can = permissions => (profile, task, params) => {

  const establishment = (profile.establishments || []).find(e => e.id === parseInt(params.establishment, 10)) || {};

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

  return Promise.resolve()
    .then(() => allowed(settings, establishment.role));
};

module.exports = can;
