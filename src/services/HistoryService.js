const HistoryRepository = require('../repositories/HistoryRepository');

const create = async (data) => {
  return HistoryRepository.create({
    url: data.url,
    method: data.method || 'GET',
    status: data.status || null,
    responseTime: data.responseTime || null,
    responseSize: data.responseSize || null,
    bodyPreview: data.bodyPreview || null,
    userId: data.userId,
    workspaceId: data.workspaceId
  });
};

const listByWorkspace = async (userId, workspaceId, limit) => {
  return HistoryRepository.findByWorkspaceAndUser(workspaceId, userId, limit);
};

const listByUser = async (userId, limit) => {
  return HistoryRepository.findByUser(userId, limit);
};

const remove = async (id) => {
  return HistoryRepository.remove(id);
};

const clearByWorkspace = async (workspaceId, userId) => {
  return HistoryRepository.clearByWorkspace(workspaceId, userId);
};

module.exports = { create, listByWorkspace, listByUser, remove, clearByWorkspace };
