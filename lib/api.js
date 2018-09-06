const api = require('@asl/service/api');
const Schema = require('@asl/schema');
const can = require('./can');
const tasks = require('./get-tasks');

const errorHandler = require('./error-handler');

module.exports = settings => {
  const app = api(settings);

  const db = Schema(settings.db);

  const { Profile } = db;

  const checkPermissions = can(settings.permissions);
  const getUserTasks = tasks(settings.permissions);

  app.use((req, res, next) => {
    return Profile.query()
      .where({ userId: req.user.id })
      .eager('establishments')
      .then(profiles => profiles[0])
      .then(profile => {
        req.profile = profile;
      })
      .then(() => next())
      .catch(next);
  });

  app.use('/:task', (req, res, next) => {
    checkPermissions(req.profile, req.params.task, req.query)
      .then(isAllowed => {
        res.allowed = isAllowed;
        next();
      })
      .catch(next);
  });

  app.get('/:task', (req, res, next) => {
    let message = 'Authorised';
    if (!res.allowed) {
      message = `Unauthorised: ${req.params.task}`;
      res.status(403);
    }
    res.json({ message });
  });

  app.get('/', (req, res, next) => {
    const tasks = getUserTasks(req.profile);
    res.json(tasks);
  });

  app.use(errorHandler());

  app.db = db;

  return app;

};
