const EnvironmentService = require('../services/EnvironmentService');
const { success, error } = require('../utils/response');

const create = async (req, res, next) => {
  try {
    const env = await EnvironmentService.create(req.user.id, req.body);
    return success(res, env, 'Environment created', 201);
  } catch (err) { next(err); }
};

const listByWorkspace = async (req, res, next) => {
  try {
    const envs = await EnvironmentService.listByWorkspace(req.user.id, parseInt(req.params.workspaceId));
    return success(res, envs, 'Environments retrieved');
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const env = await EnvironmentService.getById(req.user.id, parseInt(req.params.id));
    return success(res, env, 'Environment retrieved');
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const env = await EnvironmentService.update(req.user.id, parseInt(req.params.id), req.body);
    return success(res, env, 'Environment updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await EnvironmentService.remove(req.user.id, parseInt(req.params.id));
    return success(res, null, 'Environment deleted');
  } catch (err) { next(err); }
};

module.exports = { create, listByWorkspace, getById, update, remove };
