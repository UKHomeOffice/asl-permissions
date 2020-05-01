const Cache = require('apicache');
const redis = require('redis');

module.exports = settings => {
  if (!settings.cache) {
    return (req, res, next) => next();
  }
  const redisClient = redis.createClient(settings.redis);
  redisClient.on('error', () => {});

  const options = {
    appendKey: req => req.user.id,
    redisClient
  };
  return Cache.options(options).middleware(settings.cache);
};
