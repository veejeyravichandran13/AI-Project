'use strict';

/**
 * GTA-7 PMO  ·  token-rotate  (Catalyst Basic I/O function)
 * -----------------------------------------------------------------------------
 * Proactively exchanges the stored Zoho OAuth refresh token for a fresh access
 * token and writes it into Catalyst Cache, so zoho-proxy requests are fast and
 * never blocked on a token round-trip. Intended to be wired to a Catalyst Cron
 * (e.g. every 50 minutes, since Zoho access tokens live ~1h). It is also safe
 * to invoke on demand.
 *
 * The refresh token / client secret live ONLY in Catalyst environment
 * variables — never in the browser or the client bundle.
 *
 * Required environment variables:
 *   ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN
 * Optional:
 *   ZOHO_ACCOUNTS_URL  (default https://accounts.zoho.com)
 */

const catalyst = require('zcatalyst-sdk-node');

const CACHE_KEY = 'zoho_access_token';

async function refreshAccessToken() {
  const accounts = (process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com').replace(/\/+$/, '');
  const params = new URLSearchParams({
    refresh_token: process.env.ZOHO_REFRESH_TOKEN || '',
    client_id: process.env.ZOHO_CLIENT_ID || '',
    client_secret: process.env.ZOHO_CLIENT_SECRET || '',
    grant_type: 'refresh_token',
  });
  const resp = await fetch(`${accounts}/oauth/v2/token?${params.toString()}`, { method: 'POST' });
  const json = await resp.json();
  if (!resp.ok || !json.access_token) {
    throw new Error('token refresh failed: ' + JSON.stringify(json));
  }
  return { token: json.access_token, expiresIn: Number(json.expires_in) || 3600 };
}

module.exports = async (context, basicIO) => {
  try {
    const app = catalyst.initialize(context);
    const cache = app.cache().segment();
    const { token, expiresIn } = await refreshAccessToken();
    const hours = Math.max(1, Math.floor(expiresIn / 3600));
    await cache.put(CACHE_KEY, token, hours);
    basicIO.write(JSON.stringify({ status: 'success', cached: true, expiresIn }));
  } catch (e) {
    basicIO.write(JSON.stringify({ status: 'error', message: String((e && e.message) || e) }));
  } finally {
    context.close();
  }
};
