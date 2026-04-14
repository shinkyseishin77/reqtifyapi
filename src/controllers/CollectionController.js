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
  const prisma = require('../utils/prismaClient');

  try {
    const { data } = req.body;
    let workspaceId = req.body.workspaceId;
    if (!workspaceId || !data) return error(res, 'workspaceId and data are required', 400);
    workspaceId = parseInt(workspaceId);
    if (isNaN(workspaceId)) return error(res, 'workspaceId must be a number', 400);

    let parsed;
    if (typeof data === 'string') {
      try { parsed = JSON.parse(data); } catch (e) { return error(res, 'Invalid JSON format', 400); }
    } else {
      parsed = data;
    }

    // ── Detect format version ──
    let version = 'unknown';
    let collectionName = 'Imported Collection';
    let items = [];
    let collectionAuth = null;

    if (parsed.info && parsed.item) {
      // v2.0 or v2.1 format
      const schema = parsed.info.schema || '';
      if (schema.includes('v2.1')) version = 'v2.1';
      else if (schema.includes('v2.0')) version = 'v2.0';
      else version = 'v2.x';
      collectionName = parsed.info.name || collectionName;
      items = parsed.item || [];
      collectionAuth = parsed.auth || null;
    } else if (parsed.requests && Array.isArray(parsed.requests)) {
      // v1.0 legacy format
      version = 'v1.0';
      collectionName = parsed.name || collectionName;
      // Convert v1 requests to v2-like items
      items = parsed.requests.map(r => ({
        name: r.name || r.url || 'Untitled',
        request: {
          method: r.method || 'GET',
          url: r.url || '',
          header: typeof r.headers === 'string'
            ? r.headers.split('\n').filter(h => h.includes(':')).map(h => {
              const [key, ...rest] = h.split(':');
              return { key: key.trim(), value: rest.join(':').trim() };
            })
            : [],
          body: r.rawModeData ? { mode: 'raw', raw: r.rawModeData } : null,
        }
      }));
    } else if (parsed.collection) {
      // Wrapped format: { collection: { info: ..., item: ... } }
      const col = parsed.collection;
      collectionName = col.info?.name || collectionName;
      items = col.item || [];
      collectionAuth = col.auth || null;
      version = 'v2.x-wrapped';
    } else {
      return error(res, 'Unrecognized Postman format. Expected v1.0 (requests[]) or v2.x (info + item[]).', 400);
    }

    // Create root collection
    const rootCol = await CollectionService.create(req.user.id, workspaceId, collectionName);

    let importedRequests = 0;
    let importedFolders = 0;
    let skippedItems = 0;

    // ── Helper: Parse URL (string or Postman URL object) ──
    function parseUrl(urlInput) {
      if (!urlInput) return { url: '', query: [] };
      if (typeof urlInput === 'string') return { url: urlInput, query: [] };

      let url = urlInput.raw || '';
      if (!url && urlInput.host) {
        // Reconstruct URL from parts
        const protocol = urlInput.protocol || 'https';
        const host = Array.isArray(urlInput.host) ? urlInput.host.join('.') : (urlInput.host || '');
        const port = urlInput.port ? `:${urlInput.port}` : '';
        const path = Array.isArray(urlInput.path) ? '/' + urlInput.path.join('/') : (urlInput.path || '');
        url = `${protocol}://${host}${port}${path}`;
      }

      const query = (urlInput.query || []).map(q => ({
        key: q.key || '',
        value: q.value || '',
        enabled: !q.disabled,
      }));

      return { url, query };
    }

    // ── Helper: Parse headers ──
    function parseHeaders(headerInput) {
      if (!headerInput) return [];
      if (!Array.isArray(headerInput)) return [];
      return headerInput.map(h => ({
        key: h.key || '',
        value: h.value || '',
        enabled: !h.disabled,
      }));
    }

    // ── Helper: Parse body (all modes) ──
    function parseBody(bodyInput) {
      if (!bodyInput) return { body: '', bodyType: 'raw' };

      const mode = bodyInput.mode || 'raw';
      let body = '';
      let bodyType = 'raw';

      switch (mode) {
        case 'raw':
          body = bodyInput.raw || '';
          // Check if there's a language hint in options
          if (bodyInput.options?.raw?.language === 'json') {
            bodyType = 'raw';
          }
          break;

        case 'urlencoded':
          bodyType = 'urlencoded';
          body = JSON.stringify((bodyInput.urlencoded || []).map(p => ({
            key: p.key || '',
            value: p.value || '',
            enabled: !p.disabled,
            description: p.description || '',
          })));
          break;

        case 'formdata':
          bodyType = 'formdata';
          body = JSON.stringify((bodyInput.formdata || []).map(p => ({
            key: p.key || '',
            value: p.value || '',
            type: p.type || 'text',
            enabled: !p.disabled,
            description: p.description || '',
          })));
          break;

        case 'graphql':
          bodyType = 'raw';
          // Convert GraphQL to JSON raw body
          const gql = bodyInput.graphql || {};
          body = JSON.stringify({
            query: gql.query || '',
            variables: gql.variables || '',
          }, null, 2);
          break;

        case 'file':
          bodyType = 'raw';
          body = '/* File upload - not supported in import */';
          break;

        default:
          body = bodyInput.raw || '';
          break;
      }

      return { body, bodyType };
    }

    // ── Helper: Parse auth (all types) ──
    function parseAuth(authInput) {
      if (!authInput || authInput.type === 'noauth') return '{}';

      const type = authInput.type;
      const getValues = (arr) => {
        if (!Array.isArray(arr)) return {};
        const obj = {};
        arr.forEach(item => { obj[item.key] = item.value; });
        return obj;
      };

      switch (type) {
        case 'bearer': {
          const vals = getValues(authInput.bearer || []);
          return JSON.stringify({ type: 'bearer', token: vals.token || '' });
        }
        case 'basic': {
          const vals = getValues(authInput.basic || []);
          return JSON.stringify({ type: 'basic', username: vals.username || '', password: vals.password || '' });
        }
        case 'apikey': {
          const vals = getValues(authInput.apikey || []);
          return JSON.stringify({ type: 'apikey', key: vals.key || '', value: vals.value || '', in: vals.in || 'header' });
        }
        case 'oauth2': {
          const vals = getValues(authInput.oauth2 || []);
          return JSON.stringify({ type: 'bearer', token: vals.accessToken || '' });
        }
        case 'digest': {
          const vals = getValues(authInput.digest || []);
          return JSON.stringify({ type: 'basic', username: vals.username || '', password: vals.password || '' });
        }
        default:
          return '{}';
      }
    }

    // ── Recursively import items ──
    const importItems = async (itemList, parentCollectionId, inheritedAuth) => {
      for (const item of itemList) {
        try {
          if (item.item && Array.isArray(item.item)) {
            // It's a folder / ItemGroup
            const folder = await prisma.collection.create({
              data: {
                name: item.name || 'Untitled Folder',
                workspaceId,
                parentId: parentCollectionId,
              }
            });
            importedFolders++;
            // Folders can have their own auth that children inherit
            const folderAuth = item.auth || inheritedAuth;
            await importItems(item.item, folder.id, folderAuth);
          } else if (item.request) {
            // It's a request
            const r = item.request;
            const method = (r.method || 'GET').toUpperCase();
            const { url, query } = parseUrl(r.url);
            const headers = parseHeaders(r.header);
            const { body, bodyType } = parseBody(r.body);

            // Auth: request-level > folder-level > collection-level
            const effectiveAuth = r.auth || inheritedAuth;
            const auth = parseAuth(effectiveAuth);

            // Pre-request & test scripts
            let preRequestScript = '';
            let testScript = '';
            if (item.event && Array.isArray(item.event)) {
              const preReq = item.event.find(e => e.listen === 'prerequest');
              const test = item.event.find(e => e.listen === 'test');
              if (preReq?.script?.exec) {
                preRequestScript = Array.isArray(preReq.script.exec) ? preReq.script.exec.join('\n') : preReq.script.exec;
              }
              if (test?.script?.exec) {
                testScript = Array.isArray(test.script.exec) ? test.script.exec.join('\n') : test.script.exec;
              }
            }

            await prisma.request.create({
              data: {
                name: item.name || 'Untitled Request',
                method,
                url,
                query: JSON.stringify(query),
                headers: JSON.stringify(headers),
                body,
                bodyType,
                auth,
                preRequestScript: preRequestScript || null,
                testScript: testScript || null,
                collectionId: parentCollectionId,
              }
            });
            importedRequests++;
          }
        } catch (itemErr) {
          console.error(`Failed to import item "${item.name}":`, itemErr.message);
          skippedItems++;
        }
      }
    };

    await importItems(items, rootCol.id, collectionAuth);

    const message = `Imported "${collectionName}" (${version}): ${importedRequests} requests, ${importedFolders} folders` +
      (skippedItems > 0 ? `, ${skippedItems} skipped` : '');

    return success(res, {
      collectionId: rootCol.id,
      collectionName,
      version,
      importedFolders,
      importedRequests,
      skippedItems,
    }, message, 201);
  } catch (err) {
    console.error('Import error:', err);
    next(err);
  }
};

module.exports = { create, listByWorkspace, getById, update, remove, importPostman };
