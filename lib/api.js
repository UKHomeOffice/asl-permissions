const api = require('@asl/service/api');

const can = require('./can');

const errorHandler = require('./error-handler');

module.exports = settings => {
  const app = api(settings);

  const checkPermissions = can(settings.permissions);

  app.get('/:task', (req, res, next) => {
    checkPermissions(req.user, req.params.task, req.query)
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

  return app;

};
