const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/response');

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return error(res, 'Not authorized to access this route', 401);
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return error(res, 'Not authorized to access this route', 401);
    }

    req.user = decoded; // { id, role, ... }
    next();
  } catch (err) {
    return error(res, 'Not authorized to access this route', 401);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return error(res, `User role ${req.user.role} is not authorized to access this route`, 403);
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};
