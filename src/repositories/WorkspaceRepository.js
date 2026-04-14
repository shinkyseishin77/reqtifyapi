const prisma = require('../utils/prismaClient');

const create = async (data) => {
  return prisma.workspace.create({ data });
};

const findById = async (id) => {
  return prisma.workspace.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } }
      },
      collections: { where: { parentId: null }, orderBy: { name: 'asc' } },
      environments: true,
    }
  });
};

const findByUserId = async (userId) => {
  return prisma.workspace.findMany({
    where: {
      members: { some: { userId } }
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } }
      },
      _count: { select: { collections: true, environments: true } }
    },
    orderBy: { updatedAt: 'desc' }
  });
};

const update = async (id, data) => {
  return prisma.workspace.update({ where: { id }, data });
};

const remove = async (id) => {
  return prisma.workspace.delete({ where: { id } });
};

const addMember = async (workspaceId, userId, role = 'viewer') => {
  return prisma.workspaceMember.create({
    data: { workspaceId, userId, role }
  });
};

const updateMemberRole = async (workspaceId, userId, role) => {
  return prisma.workspaceMember.update({
    where: { userId_workspaceId: { userId, workspaceId } },
    data: { role }
  });
};

const removeMember = async (workspaceId, userId) => {
  return prisma.workspaceMember.delete({
    where: { userId_workspaceId: { userId, workspaceId } }
  });
};

const findMember = async (workspaceId, userId) => {
  return prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } }
  });
};

module.exports = {
  create, findById, findByUserId, update, remove,
  addMember, updateMemberRole, removeMember, findMember
};
