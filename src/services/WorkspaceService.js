const WorkspaceRepository = require('../repositories/WorkspaceRepository');

const create = async (userId, name, description) => {
  const workspace = await WorkspaceRepository.create({ name, description });
  // Auto-add creator as owner
  await WorkspaceRepository.addMember(workspace.id, userId, 'owner');
  return WorkspaceRepository.findById(workspace.id);
};

const listByUser = async (userId) => {
  return WorkspaceRepository.findByUserId(userId);
};

const getById = async (workspaceId, userId) => {
  const member = await WorkspaceRepository.findMember(workspaceId, userId);
  if (!member) throw new Error('Access denied');
  return WorkspaceRepository.findById(workspaceId);
};

const update = async (workspaceId, userId, data) => {
  const member = await WorkspaceRepository.findMember(workspaceId, userId);
  if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
    throw new Error('Not authorized to update this workspace');
  }
  return WorkspaceRepository.update(workspaceId, data);
};

const remove = async (workspaceId, userId) => {
  const member = await WorkspaceRepository.findMember(workspaceId, userId);
  if (!member || member.role !== 'owner') {
    throw new Error('Only owner can delete workspace');
  }
  return WorkspaceRepository.remove(workspaceId);
};

const addMember = async (workspaceId, userId, targetUserId, role) => {
  const member = await WorkspaceRepository.findMember(workspaceId, userId);
  if (!member || member.role !== 'owner') {
    throw new Error('Only owner can add members');
  }
  const existing = await WorkspaceRepository.findMember(workspaceId, targetUserId);
  if (existing) throw new Error('User is already a member');
  return WorkspaceRepository.addMember(workspaceId, targetUserId, role);
};

const updateMemberRole = async (workspaceId, userId, targetUserId, role) => {
  const member = await WorkspaceRepository.findMember(workspaceId, userId);
  if (!member || member.role !== 'owner') {
    throw new Error('Only owner can change roles');
  }
  return WorkspaceRepository.updateMemberRole(workspaceId, targetUserId, role);
};

const removeMember = async (workspaceId, userId, targetUserId) => {
  const member = await WorkspaceRepository.findMember(workspaceId, userId);
  if (!member || member.role !== 'owner') {
    throw new Error('Only owner can remove members');
  }
  if (userId === targetUserId) throw new Error('Owner cannot remove themselves');
  return WorkspaceRepository.removeMember(workspaceId, targetUserId);
};

module.exports = {
  create, listByUser, getById, update, remove,
  addMember, updateMemberRole, removeMember
};
