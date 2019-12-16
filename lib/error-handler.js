module.exports = () => {

  return (error, req, res, next) => {
    const status = error.status || 500;
    if (typeof req.log === 'function') {
      req.log('error', { message: error.message, stack: error.stack, status });
    }
    res.status(status);
    res.json({ message: error.message });
  };

};
