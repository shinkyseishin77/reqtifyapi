const prisma = require('../utils/prismaClient');

const create = async (data) => {
  return prisma.request.create({ data });
};

const findById = async (id) => {
  return prisma.request.findUnique({ where: { id } });
};

const findByCollectionId = async (collectionId) => {
  return prisma.request.findMany({
    where: { collectionId },
    orderBy: { name: 'asc' }
  });
};

const update = async (id, data) => {
  return prisma.request.update({ where: { id }, data });
};

const remove = async (id) => {
  return prisma.request.delete({ where: { id } });
};

module.exports = { create, findById, findByCollectionId, update, remove };
