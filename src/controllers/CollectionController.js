const CollectionService = require('../services/CollectionService');
const { success, error } = require('../utils/response');

const create = async (req, res, next) => {
  try {
    const { name, workspaceId, parentId } = req.body;
    if (!name || !workspaceId) return error(res, 'Name and workspaceId are required', 400);
    const collection = await CollectionService.create(req.user.id, workspaceId, name, parentId);
    return success(res, collection, 'Collection created', 201);
  } catch (err) {
    if (err.message === 'Access denied') return error(res, err.message, 403);
    next(err);
  }
};

const listByWorkspace = async (req, res, next) => {
  try {
    const collections = await CollectionService.listByWorkspace(req.user.id, parseInt(req.params.workspaceId));
    return success(res, collections, 'Collections retrieved');
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const collection = await CollectionService.getById(req.user.id, parseInt(req.params.id));
    return success(res, collection, 'Collection retrieved');
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { name } = req.body;
    const collection = await CollectionService.update(req.user.id, parseInt(req.params.id), { name });
    return success(res, collection, 'Collection updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await CollectionService.remove(req.user.id, parseInt(req.params.id));
    return success(res, null, 'Collection deleted');
  } catch (err) { next(err); }
};

module.exports = { create, listByWorkspace, getById, update, remove };
