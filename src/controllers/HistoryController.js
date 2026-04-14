const HistoryService = require('../services/HistoryService');
const { success, error } = require('../utils/response');

const list = async (req, res, next) => {
  try {
    const workspaceId = req.query.workspaceId ? parseInt(req.query.workspaceId) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    let history;
    if (workspaceId) {
      history = await HistoryService.listByWorkspace(req.user.id, workspaceId, limit);
    } else {
      history = await HistoryService.listByUser(req.user.id, limit);
    }
    return success(res, history, 'History retrieved');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await HistoryService.remove(parseInt(req.params.id));
    return success(res, null, 'History entry deleted');
  } catch (err) { next(err); }
};

const clear = async (req, res, next) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId);
    await HistoryService.clearByWorkspace(workspaceId, req.user.id);
    return success(res, null, 'History cleared');
  } catch (err) { next(err); }
};

module.exports = { list, remove, clear };
