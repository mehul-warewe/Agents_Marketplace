import axios from 'axios';

/** Shared logic for Pipedream OAuth authentication to prevent circular dependencies */
export const pipedreamAuthService = {
  async getOAuthToken(): Promise<string> {
    const { PIPEDREAM_CLIENT_ID, PIPEDREAM_CLIENT_SECRET } = process.env;
    const auth = Buffer.from(`${PIPEDREAM_CLIENT_ID}:${PIPEDREAM_CLIENT_SECRET}`).toString('base64');
    const res = await axios.post(
      'https://api.pipedream.com/v1/oauth/token',
      new URLSearchParams({ grant_type: 'client_credentials' }),
      { headers: { Authorization: `Basic ${auth}` } }
    );
    return res.data.access_token;
  }
};
