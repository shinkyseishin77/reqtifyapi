const axios = require('axios');

/**
 * Execute HTTP Request as proxy
 * @param {Object} options 
 * @param {string} options.method GET, POST, PUT, DELETE, etc.
 * @param {string} options.url Target URL
 * @param {Object} options.headers Key-value pairs for headers
 * @param {Object|string} options.body Body data
 * @param {string} options.auth Config for authorization
 */
const executeRequest = async (options) => {
  const { method, url, headers, body, auth } = options;

  let requestHeaders = { ...headers };
  let requestData = body;

  // Handle Auth
  if (auth && auth.type) {
    if (auth.type === 'bearer' && auth.token) {
      requestHeaders['Authorization'] = `Bearer ${auth.token}`;
    } else if (auth.type === 'basic' && auth.username) {
      const basicToken = Buffer.from(`${auth.username}:${auth.password || ''}`).toString('base64');
      requestHeaders['Authorization'] = `Basic ${basicToken}`;
    }
  }

  // Ensure axios doesn't throw on non-2xx status codes because we want to see the error response
  const startTime = Date.now();
  let responseSize = 0;
  try {
    const response = await axios({
      method: method || 'GET',
      url,
      headers: requestHeaders,
      data: requestData,
      validateStatus: () => true, // resolve all status codes
      maxRedirects: 5,
    });

    const endTime = Date.now();
    
    // Estimate size
    const rawData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    responseSize = rawData ? Buffer.byteLength(rawData, 'utf8') : 0;

    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      time: endTime - startTime,
      size: responseSize
    };

  } catch (error) {
    const endTime = Date.now();
    return {
      status: error.response?.status || 0,
      statusText: error.code || 'Error',
      headers: error.response?.headers || {},
      data: error.response?.data || error.message,
      time: endTime - startTime,
      size: 0,
      error: true
    };
  }
};

module.exports = {
  executeRequest
};
