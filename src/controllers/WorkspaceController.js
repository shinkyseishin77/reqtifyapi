const WorkspaceService = require('../services/WorkspaceService');
const AuthRepository = require('../repositories/AuthRepository');
const { success, error } = require('../utils/response');

const create = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return error(res, 'Name is required', 400);
    const workspace = await WorkspaceService.create(req.user.id, name, description);
    return success(res, workspace, 'Workspace created', 201);
  } catch (err) { next(err); }
};

const list = async (req, res, next) => {
  try {
    const workspaces = await WorkspaceService.listByUser(req.user.id);
    return success(res, workspaces, 'Workspaces retrieved');
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const workspace = await WorkspaceService.getById(parseInt(req.params.id), req.user.id);
    return success(res, workspace, 'Workspace retrieved');
  } catch (err) {
    if (err.message === 'Access denied') return error(res, err.message, 403);
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const workspace = await WorkspaceService.update(parseInt(req.params.id), req.user.id, { name, description });
    return success(res, workspace, 'Workspace updated');
  } catch (err) {
    if (err.message.includes('Not authorized')) return error(res, err.message, 403);
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await WorkspaceService.remove(parseInt(req.params.id), req.user.id);
    return success(res, null, 'Workspace deleted');
  } catch (err) {
    if (err.message.includes('Only owner')) return error(res, err.message, 403);
    next(err);
  }
};

const addMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email) return error(res, 'Email is required', 400);
    const targetUser = await AuthRepository.findUserByEmail(email);
    if (!targetUser) return error(res, 'User not found', 404);
    const member = await WorkspaceService.addMember(parseInt(req.params.id), req.user.id, targetUser.id, role || 'viewer');
    return success(res, member, 'Member added', 201);
  } catch (err) {
    if (err.message.includes('Only owner') || err.message.includes('already a member')) return error(res, err.message, 400);
    next(err);
  }
};

const updateMemberRole = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    await WorkspaceService.updateMemberRole(parseInt(req.params.id), req.user.id, userId, role);
    return success(res, null, 'Member role updated');
  } catch (err) { next(err); }
};

const removeMember = async (req, res, next) => {
  try {
    await WorkspaceService.removeMember(parseInt(req.params.id), req.user.id, parseInt(req.params.userId));
    return success(res, null, 'Member removed');
  } catch (err) { next(err); }
};

module.exports = { create, list, getById, update, remove, addMember, updateMemberRole, removeMember };
