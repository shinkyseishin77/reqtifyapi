const CollectionRepository = require('../repositories/CollectionRepository');
const WorkspaceRepository = require('../repositories/WorkspaceRepository');

const assertAccess = async (workspaceId, userId, needEdit = false) => {
  const member = await WorkspaceRepository.findMember(workspaceId, userId);
  if (!member) throw new Error('Access denied');
  if (needEdit && member.role === 'viewer') throw new Error('Viewer cannot modify collections');
  return member;
};

const create = async (userId, workspaceId, name, parentId = null) => {
  await assertAccess(workspaceId, userId, true);
  return CollectionRepository.create({ name, workspaceId, parentId });
};

const listByWorkspace = async (userId, workspaceId) => {
  await assertAccess(workspaceId, userId);
  return CollectionRepository.findByWorkspaceId(workspaceId);
};

const getById = async (userId, collectionId) => {
  const collection = await CollectionRepository.findById(collectionId);
  if (!collection) throw new Error('Collection not found');
  await assertAccess(collection.workspaceId, userId);
  return collection;
};

const update = async (userId, collectionId, data) => {
  const collection = await CollectionRepository.findById(collectionId);
  if (!collection) throw new Error('Collection not found');
  await assertAccess(collection.workspaceId, userId, true);
  return CollectionRepository.update(collectionId, { name: data.name });
};

const remove = async (userId, collectionId) => {
  const collection = await CollectionRepository.findById(collectionId);
  if (!collection) throw new Error('Collection not found');
  await assertAccess(collection.workspaceId, userId, true);
  return CollectionRepository.remove(collectionId);
};

module.exports = { create, listByWorkspace, getById, update, remove };
