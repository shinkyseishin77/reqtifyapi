const EnvironmentRepository = require('../repositories/EnvironmentRepository');
const WorkspaceRepository = require('../repositories/WorkspaceRepository');

const assertAccess = async (workspaceId, userId, needEdit = false) => {
  if (!workspaceId) return; // global envs accessible to all
  const member = await WorkspaceRepository.findMember(workspaceId, userId);
  if (!member) throw new Error('Access denied');
  if (needEdit && member.role === 'viewer') throw new Error('Viewer cannot modify environments');
};

const create = async (userId, data) => {
  await assertAccess(data.workspaceId, userId, true);
  return EnvironmentRepository.create({
    name: data.name,
    variables: JSON.stringify(data.variables || []),
    workspaceId: data.workspaceId || null
  });
};

const listByWorkspace = async (userId, workspaceId) => {
  await assertAccess(workspaceId, userId);
  const envs = await EnvironmentRepository.findByWorkspaceId(workspaceId);
  return envs.map(e => ({
    ...e,
    variables: e.variables ? JSON.parse(e.variables) : []
  }));
};

const getById = async (userId, envId) => {
  const env = await EnvironmentRepository.findById(envId);
  if (!env) throw new Error('Environment not found');
  await assertAccess(env.workspaceId, userId);
  return {
    ...env,
    variables: env.variables ? JSON.parse(env.variables) : []
  };
};

const update = async (userId, envId, data) => {
  const env = await EnvironmentRepository.findById(envId);
  if (!env) throw new Error('Environment not found');
  await assertAccess(env.workspaceId, userId, true);

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.variables !== undefined) updateData.variables = JSON.stringify(data.variables);

  return EnvironmentRepository.update(envId, updateData);
};

const remove = async (userId, envId) => {
  const env = await EnvironmentRepository.findById(envId);
  if (!env) throw new Error('Environment not found');
  await assertAccess(env.workspaceId, userId, true);
  return EnvironmentRepository.remove(envId);
};

module.exports = { create, listByWorkspace, getById, update, remove };
