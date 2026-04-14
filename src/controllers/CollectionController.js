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

const importPostman = async (req, res, next) => {
  try {
    const { workspaceId, data } = req.body;
    if (!workspaceId || !data) return error(res, 'workspaceId and data are required', 400);

    let parsed;
    if (typeof data === 'string') {
      try { parsed = JSON.parse(data); } catch(e) { return error(res, 'Invalid JSON format', 400); }
    } else {
      parsed = data;
    }

    // Validate Postman Collection v2.1 format
    if (!parsed.info || !parsed.item) {
      return error(res, 'Invalid Postman Collection format. Expected "info" and "item" fields.', 400);
    }

    const collectionName = parsed.info.name || 'Imported Collection';

    // Create root collection
    const rootCol = await CollectionService.create(req.user.id, workspaceId, collectionName);

    let importedRequests = 0;
    let importedFolders = 0;

    // Recursively import items
    const importItems = async (items, parentCollectionId) => {
      for (const item of items) {
        if (item.item && Array.isArray(item.item)) {
          // It's a folder
          const prisma = require('../utils/prismaClient');
          const folder = await prisma.collection.create({
            data: {
              name: item.name || 'Untitled Folder',
              workspaceId,
              parentId: parentCollectionId,
            }
          });
          importedFolders++;
          await importItems(item.item, folder.id);
        } else if (item.request) {
          // It's a request
          const req = item.request;
          let url = '';
          if (typeof req.url === 'string') {
            url = req.url;
          } else if (req.url && req.url.raw) {
            url = req.url.raw;
          }

          let method = (req.method || 'GET').toUpperCase();

          // Parse headers
          const headers = (req.header || []).map(h => ({
            key: h.key || '',
            value: h.value || '',
            enabled: !h.disabled,
          }));

          // Parse body
          let body = '';
          let bodyType = 'raw';
          if (req.body) {
            if (req.body.mode === 'raw' && req.body.raw) {
              body = req.body.raw;
            } else if (req.body.mode === 'urlencoded') {
              bodyType = 'urlencoded';
              body = JSON.stringify(req.body.urlencoded || []);
            } else if (req.body.mode === 'formdata') {
              bodyType = 'formdata';
              body = JSON.stringify(req.body.formdata || []);
            }
          }

          // Parse query params
          let query = '[]';
          if (req.url && req.url.query) {
            query = JSON.stringify(req.url.query.map(q => ({
              key: q.key || '',
              value: q.value || '',
              enabled: !q.disabled,
            })));
          }

          // Parse auth
          let auth = '{}';
          if (req.auth) {
            if (req.auth.type === 'bearer') {
              const bearerArr = req.auth.bearer || [];
              const tokenObj = bearerArr.find(b => b.key === 'token');
              auth = JSON.stringify({ type: 'bearer', token: tokenObj?.value || '' });
            } else if (req.auth.type === 'basic') {
              const basicArr = req.auth.basic || [];
              const user = basicArr.find(b => b.key === 'username');
              const pass = basicArr.find(b => b.key === 'password');
              auth = JSON.stringify({ type: 'basic', username: user?.value || '', password: pass?.value || '' });
            }
          }

          const prisma = require('../utils/prismaClient');
          await prisma.request.create({
            data: {
              name: item.name || 'Untitled Request',
              method,
              url,
              query,
              headers: JSON.stringify(headers),
              body,
              bodyType,
              auth,
              collectionId: parentCollectionId,
            }
          });
          importedRequests++;
        }
      }
    };

    await importItems(parsed.item, rootCol.id);

    return success(res, {
      collectionId: rootCol.id,
      collectionName,
      importedFolders,
      importedRequests,
    }, `Imported "${collectionName}": ${importedRequests} requests, ${importedFolders} folders`, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { create, listByWorkspace, getById, update, remove, importPostman };
