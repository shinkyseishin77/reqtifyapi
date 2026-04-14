const ProxyService = require('../services/ProxyService');
const HistoryService = require('../services/HistoryService');
const { success, error } = require('../utils/response');

const sendRequest = async (req, res, next) => {
  try {
    const { method, url, headers, body, auth, workspaceId } = req.body;
    
    if (!url) {
      return error(res, 'URL is required', 400);
    }

    const result = await ProxyService.executeRequest({
      method, url, headers, body, auth
    });

    // Auto-save to history if workspaceId provided
    if (workspaceId) {
      try {
        let bodyPreview = '';
        if (result.data) {
          bodyPreview = typeof result.data === 'string' 
            ? result.data.substring(0, 500)
            : JSON.stringify(result.data).substring(0, 500);
        }
        await HistoryService.create({
          url,
          method: method || 'GET',
          status: result.status,
          responseTime: result.time,
          responseSize: result.size,
          bodyPreview,
          userId: req.user.id,
          workspaceId: parseInt(workspaceId)
        });
      } catch (historyErr) {
        console.error('Failed to save history:', historyErr.message);
      }
    }

    return success(res, result, 'Request executed successfully', 200);
  } catch (err) {
    next(err);
  }
};

module.exports = { sendRequest };
