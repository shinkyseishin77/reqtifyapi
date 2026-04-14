const prisma = require('../utils/prismaClient');

const create = async (data) => {
  return prisma.collection.create({ data });
};

const findById = async (id) => {
  return prisma.collection.findUnique({
    where: { id },
    include: {
      requests: { orderBy: { name: 'asc' } },
      children: {
        include: {
          requests: { orderBy: { name: 'asc' } },
          children: {
            include: {
              requests: { orderBy: { name: 'asc' } }
            }
          }
        },
        orderBy: { name: 'asc' }
      }
    }
  });
};

const findByWorkspaceId = async (workspaceId) => {
  return prisma.collection.findMany({
    where: { workspaceId, parentId: null },
    include: {
      requests: { orderBy: { name: 'asc' } },
      children: {
        include: {
          requests: { orderBy: { name: 'asc' } },
          children: {
            include: {
              requests: { orderBy: { name: 'asc' } }
            }
          }
        },
        orderBy: { name: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
  });
};

const update = async (id, data) => {
  return prisma.collection.update({ where: { id }, data });
};

const remove = async (id) => {
  return prisma.collection.delete({ where: { id } });
};

module.exports = { create, findById, findByWorkspaceId, update, remove };
