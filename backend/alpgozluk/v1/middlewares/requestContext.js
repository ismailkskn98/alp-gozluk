const { randomUUID } = require('node:crypto');

const requestContext = (req, res, next) => {
  req.requestId = req.get('x-request-id') || randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
};

module.exports = requestContext;
