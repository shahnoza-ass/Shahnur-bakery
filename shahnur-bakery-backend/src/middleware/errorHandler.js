const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: message.join(', '),
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'Ma?lumot';
    const message = `${field} allaqachon mavjud`;
    return res.status(400).json({
      success: false,
      message: message,
    });
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    return res.status(400).json({
      success: false,
      message: message,
    });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Noto\'g\'ri token',
    });
  }

  // JWT expired error
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token muddati tugagan',
    });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: (error.statusCode && error.statusCode < 500) || process.env.NODE_ENV === 'development' ? error.message : 'Serverda xatolik yuz berdi',
  });
};

module.exports = errorHandler;