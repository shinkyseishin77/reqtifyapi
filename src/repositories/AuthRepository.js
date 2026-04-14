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

const searchByEmail = async (query, excludeUserId = null) => {
  const where = {
    email: { contains: query }
  };
  if (excludeUserId) {
    where.id = { not: excludeUserId };
  }
  return prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true },
    take: 10,
  });
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  searchByEmail
};
