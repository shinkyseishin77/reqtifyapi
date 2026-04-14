const prisma = require('../utils/prismaClient');

const create = async (data) => {
  return prisma.environment.create({ data });
};

const findById = async (id) => {
  return prisma.environment.findUnique({ where: { id } });
};

const findByWorkspaceId = async (workspaceId) => {
  return prisma.environment.findMany({
    where: { workspaceId },
    orderBy: { name: 'asc' }
  });
};

const findGlobals = async () => {
  return prisma.environment.findMany({
    where: { workspaceId: null },
    orderBy: { name: 'asc' }
  });
};

const update = async (id, data) => {
  return prisma.environment.update({ where: { id }, data });
};

const remove = async (id) => {
  return prisma.environment.delete({ where: { id } });
};

module.exports = { create, findById, findByWorkspaceId, findGlobals, update, remove };
