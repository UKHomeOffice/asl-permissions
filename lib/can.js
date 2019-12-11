const { get } = require('lodash');
const { allowed } = require('./utils');

const can = permissions => (user, task, subject) => {

  if (!user) {
    const err = new Error('Unknown user');
    err.status = 400;
    return Promise.reject(err);
  }
  const establishmentId = parseInt(subject.establishment, 10);
  const establishment = (user.establishments || []).find(e => e.id === establishmentId) || {};
  const roles = (user.roles || []).filter(role => role.establishmentId === establishmentId);

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
        roles,
        role: establishment.role
      },
      subject
    }));
};

module.exports = can;
