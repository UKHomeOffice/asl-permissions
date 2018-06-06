const express = require('express');

module.exports = (api, user) => {

  const app = express();

  app.use((req, res, next) => {
    req.user = user;
    next();
  });

  app.use(api);

  return app;

};
