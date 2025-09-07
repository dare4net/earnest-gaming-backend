/*const winston = require('winston');

// Create Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Write logs to file
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    // Write to console in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log when the request completes
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userIP: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id || 'anonymous',
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined // Log body for non-GET requests
    });
  });

  // Log errors
  res.on('error', (error) => {
    logger.error({
      method: req.method,
      url: req.url,
      error: error.message,
      stack: error.stack,
      userIP: req.ip,
      userId: req.user?.id || 'anonymous'
    });
  });

  next();
};

module.exports = {
  logger,
  requestLogger
};*/
