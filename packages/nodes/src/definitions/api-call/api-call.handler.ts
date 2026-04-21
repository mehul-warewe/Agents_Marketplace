import { ToolHandler } from '../../types.js';
import axios from 'axios';

export const apiCallHandler: ToolHandler = async (ctx) => {
  const { config, render } = ctx;
  const url = render(config.url || '');
  const method = (config.method || 'POST').toUpperCase();
  const headersStr = render(config.headers || '{}');
  const bodyStr = render(config.body || '{}');

  if (!url) {
    return { error: 'Endpoint URL is required' };
  }

  try {
    let headers = {};
    try {
      headers = JSON.parse(headersStr);
    } catch (e) {
      console.warn(`[API Protocol] Failed to parse headers:`, headersStr);
    }

    let data = undefined;
    if (method !== 'GET' && bodyStr) {
      try {
        data = JSON.parse(bodyStr);
      } catch (e) {
        // If not valid JSON, send as raw string/template
        data = bodyStr;
      }
    }

    const response = await axios({
      method,
      url,
      headers,
      data,
      timeout: 30000,
    });

    return {
      status: 'completed',
      data: response.data,
      statusCode: response.status,
      headers: response.headers
    };
  } catch (err: any) {
    return { 
      status: 'failed',
      error: `API Call Failed: ${err.message}`, 
      response: err.response?.data,
      statusCode: err.response?.status
    };
  }
};
