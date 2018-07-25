const api = require('@asl/service/api');
const Schema = require('@asl/schema');
const can = require('./can');

const errorHandler = require('./error-handler');

module.exports = settings => {
  const app = api(settings);

  const db = Schema(settings.db);

  const { Profile, Establishment } = db;

  const checkPermissions = can(settings.permissions, db);

  app.get('/:task', (req, res, next) => {
    return Profile.findOne({ where: { userId: req.user.id }, include: { model: Establishment } })
      .then(profile => {
        return checkPermissions(profile, req.params.task, req.query);
      })
      .then(isAllowed => {
        res.allowed = isAllowed;
        next();
      })
      .catch(e => next());
  });

  app.use('/:task?', (req, res, next) => {
    let message = 'Authorised';
    if (!res.allowed) {
      message = `Unauthorised: ${req.params.task}`;
      res.status(403);
    }
    res.json({ message });
  });

  app.use(errorHandler());

  app.db = db;

  return app;

};
