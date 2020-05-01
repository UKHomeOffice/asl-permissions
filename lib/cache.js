const Cache = require('apicache');
const redis = require('redis');

module.exports = settings => {
  if (!settings.cache) {
    return (req, res, next) => next();
  }
  const redisClient = redis.createClient(settings.redis);
  redisClient.on('error', e => {
    console.error(`Redis failed with error: ${e.message} - falling back to in-memory cache store`);
  });

  const options = {
    appendKey: req => req.user.id,
    redisClient
  };
  return Cache.options(options).middleware(settings.cache);
};
