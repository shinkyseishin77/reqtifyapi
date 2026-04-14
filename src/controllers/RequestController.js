const RequestService = require('../services/RequestService');
const { success, error } = require('../utils/response');

const create = async (req, res, next) => {
  try {
    const request = await RequestService.create(req.user.id, req.body);
    return success(res, request, 'Request saved', 201);
  } catch (err) {
    if (err.message === 'Access denied' || err.message.includes('Viewer')) return error(res, err.message, 403);
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const request = await RequestService.getById(req.user.id, parseInt(req.params.id));
    return success(res, request, 'Request retrieved');
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const request = await RequestService.update(req.user.id, parseInt(req.params.id), req.body);
    return success(res, request, 'Request updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await RequestService.remove(req.user.id, parseInt(req.params.id));
    return success(res, null, 'Request deleted');
  } catch (err) { next(err); }
};

module.exports = { create, getById, update, remove };
