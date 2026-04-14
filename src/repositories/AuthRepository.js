const prisma = require('../utils/prismaClient');

const createUser = async (userData) => {
  return prisma.user.create({
    data: userData
  });
};

const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email }
  });
};

const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id }
  });
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById
};
