const { get } = require('lodash');
const { allowed } = require('./utils');

const can = ({ db, permissions }) => (user, task, subject) => {

  const isAllowed = allowed({ db });

  if (!user) {
    const err = new Error('Unknown user');
    err.status = 400;
    return Promise.reject(err);
  }

  const settings = get(permissions, task);
  const model = task.split('.')[0];
  if (!settings) {
    const err = new Error(`Unknown task: ${task}`);
    err.status = 404;
    return Promise.reject(err);
  }

  return Promise.resolve()
    .then(() => isAllowed({
      model,
      user,
      subject,
      roles: settings
    }));
};

module.exports = can;
