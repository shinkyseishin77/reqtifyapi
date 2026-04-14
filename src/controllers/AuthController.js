const AuthService = require('../services/AuthService');
const { success, error } = require('../utils/response');
const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const register = async (req, res, next) => {
  try {
    const { error: validationError } = registerSchema.validate(req.body);
    if (validationError) return error(res, validationError.details[0].message, 400);

    const { name, email, password } = req.body;
    const result = await AuthService.register(name, email, password);
    return success(res, result, 'User registered successfully', 201);
  } catch (err) {
    if (err.message === 'Email already registered') return error(res, err.message, 400);
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { error: validationError } = loginSchema.validate(req.body);
    if (validationError) return error(res, validationError.details[0].message, 400);

    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    return success(res, result, 'Login successful', 200);
  } catch (err) {
    if (err.message === 'Invalid credentials') return error(res, err.message, 401);
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const AuthRepository = require('../repositories/AuthRepository');
    const user = await AuthRepository.findUserById(req.user.id);
    if (!user) return error(res, 'User not found', 404);
    return success(res, { id: user.id, name: user.name, email: user.email, role: user.role }, 'User profile retrieved');
  } catch (err) {
    next(err);
  }
}

const searchUsers = async (req, res, next) => {
  try {
    const AuthRepository = require('../repositories/AuthRepository');
    const q = req.query.q || '';
    if (q.length < 2) return success(res, [], 'Search requires at least 2 characters');
    const users = await AuthRepository.searchByEmail(q, req.user.id);
    return success(res, users, 'Users found');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe,
  searchUsers
};
