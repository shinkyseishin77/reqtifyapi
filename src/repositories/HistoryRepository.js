const prisma = require('../utils/prismaClient');

const create = async (data) => {
  return prisma.history.create({ data });
};

const findByWorkspaceAndUser = async (workspaceId, userId, limit = 50) => {
  return prisma.history.findMany({
    where: { workspaceId, userId },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
};

const findByUser = async (userId, limit = 50) => {
  return prisma.history.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
};

const remove = async (id) => {
  return prisma.history.delete({ where: { id } });
};

const clearByWorkspace = async (workspaceId, userId) => {
  return prisma.history.deleteMany({
    where: { workspaceId, userId }
  });
};

module.exports = { create, findByWorkspaceAndUser, findByUser, remove, clearByWorkspace };
