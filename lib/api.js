const api = require('@asl/service/api');
const Schema = require('@asl/schema');
const can = require('./can');
const tasks = require('./get-tasks');
const cache = require('./cache');

const errorHandler = require('./error-handler');

module.exports = settings => {
  const app = api(settings);

  const db = Schema(settings.db);

  const { Profile } = db;

  const checkPermissions = can({ permissions: settings.permissions, db });
  const getUserTasks = tasks({ permissions: settings.permissions, db });

  app.use(cache(settings));

  app.use((req, res, next) => {
    return Profile.query()
      .where({ userId: req.user.id })
      .withGraphFetched('[establishments,roles]')
      .then(profiles => profiles[0])
      .then(profile => {
        req.profile = profile;
      })
      .then(() => next())
      .catch(next);
  });

  app.use('/:task', (req, res, next) => {
    checkPermissions({ user: req.profile, task: req.params.task, subject: req.query, log: req.log })
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
    getUserTasks(req.profile)
      .then(allowedTasks => res.json(allowedTasks))
      .catch(next);
  });

  app.use(errorHandler());

  app.db = db;

  return app;

};
