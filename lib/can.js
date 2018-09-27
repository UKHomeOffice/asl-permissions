const { get } = require('lodash');
const { allowed } = require('./utils');

const can = permissions => (user, task, subject) => {

  if (!user) {
    const err = new Error('Unknown user');
    err.status = 400;
    return Promise.reject(err);
  }

  const establishment = (user.establishments || []).find(e => e.id === parseInt(subject.establishment, 10)) || {};

  const settings = get(permissions, task);
  if (!settings) {
    const err = new Error(`Unknown task: ${task}`);
    err.status = 404;
    return Promise.reject(err);
  }

  return Promise.resolve()
    .then(() => allowed({
      roles: settings,
      user: {
        ...user,
        role: establishment.role
      },
      subject
    }));
};

module.exports = can;
