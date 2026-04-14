const RequestRepository = require('../repositories/RequestRepository');
const CollectionRepository = require('../repositories/CollectionRepository');
const WorkspaceRepository = require('../repositories/WorkspaceRepository');

const assertCollectionAccess = async (collectionId, userId, needEdit = false) => {
  const collection = await CollectionRepository.findById(collectionId);
  if (!collection) throw new Error('Collection not found');
  const member = await WorkspaceRepository.findMember(collection.workspaceId, userId);
  if (!member) throw new Error('Access denied');
  if (needEdit && member.role === 'viewer') throw new Error('Viewer cannot modify requests');
  return collection;
};

const create = async (userId, data) => {
  await assertCollectionAccess(data.collectionId, userId, true);
  return RequestRepository.create({
    name: data.name,
    method: data.method || 'GET',
    url: data.url || '',
    query: data.query ? JSON.stringify(data.query) : null,
    headers: data.headers ? JSON.stringify(data.headers) : null,
    body: data.body ? (typeof data.body === 'string' ? data.body : JSON.stringify(data.body)) : null,
    bodyType: data.bodyType || 'raw',
    auth: data.auth ? JSON.stringify(data.auth) : null,
    preRequestScript: data.preRequestScript || null,
    testScript: data.testScript || null,
    collectionId: data.collectionId
  });
};

const getById = async (userId, requestId) => {
  const request = await RequestRepository.findById(requestId);
  if (!request) throw new Error('Request not found');
  await assertCollectionAccess(request.collectionId, userId);
  // Parse JSON fields
  return parseRequest(request);
};

const update = async (userId, requestId, data) => {
  const request = await RequestRepository.findById(requestId);
  if (!request) throw new Error('Request not found');
  await assertCollectionAccess(request.collectionId, userId, true);

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.method !== undefined) updateData.method = data.method;
  if (data.url !== undefined) updateData.url = data.url;
  if (data.query !== undefined) updateData.query = JSON.stringify(data.query);
  if (data.headers !== undefined) updateData.headers = JSON.stringify(data.headers);
  if (data.body !== undefined) updateData.body = typeof data.body === 'string' ? data.body : JSON.stringify(data.body);
  if (data.bodyType !== undefined) updateData.bodyType = data.bodyType;
  if (data.auth !== undefined) updateData.auth = JSON.stringify(data.auth);
  if (data.preRequestScript !== undefined) updateData.preRequestScript = data.preRequestScript;
  if (data.testScript !== undefined) updateData.testScript = data.testScript;
  if (data.collectionId !== undefined) updateData.collectionId = data.collectionId;

  return RequestRepository.update(requestId, updateData);
};

const remove = async (userId, requestId) => {
  const request = await RequestRepository.findById(requestId);
  if (!request) throw new Error('Request not found');
  await assertCollectionAccess(request.collectionId, userId, true);
  return RequestRepository.remove(requestId);
};

const parseRequest = (req) => {
  return {
    ...req,
    query: req.query ? JSON.parse(req.query) : [],
    headers: req.headers ? JSON.parse(req.headers) : [],
    body: (() => { try { return req.body ? JSON.parse(req.body) : null; } catch { return req.body; } })(),
    auth: req.auth ? JSON.parse(req.auth) : null,
  };
};

module.exports = { create, getById, update, remove };
