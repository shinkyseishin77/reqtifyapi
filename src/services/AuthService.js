const AuthRepository = require('../repositories/AuthRepository');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { generateToken } = require('../utils/jwt');

const register = async (name, email, password) => {
  const existingUser = await AuthRepository.findUserByEmail(email);
  if (existingUser) {
    throw new Error('Email already registered');
  }

  const hashedPassword = await hashPassword(password);
  
  const user = await AuthRepository.createUser({
    name,
    email,
    password: hashedPassword,
    role: 'user'
  });

  const token = generateToken({ id: user.id, role: user.role });

  return {
    user: { id: user.id, name: user.name, email: user.email },
    token
  };
};

const login = async (email, password) => {
  const user = await AuthRepository.findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  const token = generateToken({ id: user.id, role: user.role });

  return {
    user: { id: user.id, name: user.name, email: user.email },
    token
  };
};

module.exports = {
  register,
  login
};
