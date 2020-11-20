const { get } = require('lodash');
const { traverse, allowed } = require('./utils');

module.exports = ({ permissions, db }) => {
  const tasks = traverse(permissions);
  const isAllowed = allowed({ db });

  return user => {
    if (!user) {
      const err = new Error('Unknown user');
      err.status = 400;
      return Promise.reject(err);
    }
    if (!user.emailConfirmed && !user.asruUser) {
      return Promise.resolve({});
    }

    function getTasksForEstablishment(tasks, eId) {
      const subject = eId && { establishment: eId };
      return Promise.all(tasks.map(task => taskIsAllowed(task, subject)))
        .then(results => tasks.filter((t, i) => results[i]));
    }

    function taskIsAllowed(task, subject) {
      const model = task.split('.')[0];
      return isAllowed({
        model,
        user,
        subject,
        permissions: get(permissions, task)
      });
    }

    const getEstablishmentTasks = user.establishments.map(e => {
      return Promise.resolve()
        .then(() => getTasksForEstablishment(tasks, e.id))
        .then(tasks => ({ [e.id]: tasks }));
    });

    const getGlobalTasks = getTasksForEstablishment(tasks)
      .then(tasks => ({ global: tasks }));

    return Promise.all([
      ...getEstablishmentTasks,
      getGlobalTasks
    ])
      .then(tasks => tasks.reduce((all, task) => ({ ...all, ...task }), {}));
  };
};
