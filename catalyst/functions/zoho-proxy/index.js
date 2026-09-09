'use strict';

/**
 * GTA-7 PMO  ·  zoho-proxy  (Catalyst Advanced I/O function)
 * -----------------------------------------------------------------------------
 * The browser cannot hold Zoho OAuth secrets, so this server-side function is
 * the ONLY thing that talks to Zoho Projects. It:
 *   1. Obtains a valid access token (from Catalyst Cache, refreshing via the
 *      stored refresh token when the cache is cold/expired).
 *   2. Reads the live GTA-7 program from portal PORTAL_ID / project PROJECT_ID:
 *      the native Milestones and Tasks, plus the Risk Register, Dependencies,
 *      Vendors and Issues (bugs). Milestones map from the native Milestones
 *      module and Use Cases from the native Tasks module (falling back to the
 *      custom program_phase / use_case modules when the native reads are empty).
 *   3. Reshapes them back into the exact `DATA.*` keys the SPA renders, so the
 *      front-end code stays unchanged.
 *
 * Endpoint (served by Catalyst):  GET /server/zoho-proxy/data
 *
 * Required environment variables (set in the Catalyst console, never in the
 * browser):
 *   ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN
 *   PORTAL_ID           (default 760700236)
 *   PROJECT_ID          (default 1856270000001966003 — GTA-7 Program)
 * Optional (data-centre overrides; defaults are the .com DC):
 *   ZOHO_ACCOUNTS_URL   (default https://accounts.zoho.com)
 *   ZOHO_PROJECTS_BASE  (default https://projects.zoho.com/api/v3)
 *   MILESTONE_MODULE     (default milestones — native module)
 *   TASK_MODULE          (default tasks — native module)
 *   PROGRAM_PHASE_MODULE (default program_phase)
 *   USECASE_MODULE       (default use_case)
 *   RISK_MODULE          (default custom_module1)
 *   DEPENDENCY_MODULE    (default dependency)
 *   VENDOR_MODULE        (default vendor)
 */

const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const {
  recordsOf, issuesOf, milestonesOf, tasksOf,
  mapMilestones, mapNativeMilestones, mapBugs, mapUsecases, mapNativeTasks,
  mapNativeBacklog, mapRisks, mapDependencies, mapVendors,
} = require('./mappers');

const app = express();

const ENV = process.env;
const PORTAL_ID = ENV.PORTAL_ID || '760700236';
const PROJECT_ID = ENV.PROJECT_ID || '1856270000001966003';
const ACCOUNTS_URL = (ENV.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com').replace(/\/+$/, '');
const PROJECTS_BASE = (ENV.ZOHO_PROJECTS_BASE || 'https://projects.zoho.com/api/v3').replace(/\/+$/, '');
const MODULES = {
  // Native Zoho Projects modules (source of truth for milestones & tasks).
  milestone: ENV.MILESTONE_MODULE || 'milestones',
  task: ENV.TASK_MODULE || 'tasks',
  // Custom modules (kept as enrichment/fallback sources).
  programPhase: ENV.PROGRAM_PHASE_MODULE || 'program_phase',
  useCase: ENV.USECASE_MODULE || 'use_case',
  risk: ENV.RISK_MODULE || 'custom_module1',
  dependency: ENV.DEPENDENCY_MODULE || 'dependency',
  vendor: ENV.VENDOR_MODULE || 'vendor',
};

const CACHE_KEY = 'zoho_access_token';

/* ---------- token handling ------------------------------------------------ */

async function refreshAccessToken() {
  const params = new URLSearchParams({
    refresh_token: ENV.ZOHO_REFRESH_TOKEN || '',
    client_id: ENV.ZOHO_CLIENT_ID || '',
    client_secret: ENV.ZOHO_CLIENT_SECRET || '',
    grant_type: 'refresh_token',
  });
  const resp = await fetch(`${ACCOUNTS_URL}/oauth/v2/token?${params.toString()}`, { method: 'POST' });
  const json = await resp.json();
  if (!resp.ok || !json.access_token) {
    throw new Error('token refresh failed: ' + JSON.stringify(json));
  }
  return { token: json.access_token, expiresIn: Number(json.expires_in) || 3600 };
}

async function getAccessToken(cache) {
  try {
    const cached = await cache.getValue(CACHE_KEY);
    if (cached) return cached;
  } catch (_) { /* cold cache */ }

  const { token, expiresIn } = await refreshAccessToken();
  try {
    // Cache in hours, expire a little early to avoid edge-of-life 401s.
    const hours = Math.max(1, Math.floor(expiresIn / 3600));
    await cache.put(CACHE_KEY, token, hours);
  } catch (_) { /* caching best-effort */ }
  return token;
}

/* ---------- Zoho reads ---------------------------------------------------- */

async function zohoGet(path, token) {
  const url = `${PROJECTS_BASE}${path}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Zoho-oauthtoken ${token}`, Accept: 'application/json' },
  });
  if (resp.status === 401) throw Object.assign(new Error('unauthorized'), { code: 401 });
  if (!resp.ok) throw new Error(`GET ${path} -> HTTP ${resp.status}`);
  return resp.json();
}

/* ---------- route --------------------------------------------------------- */

app.get('/data', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const out = {};
  const errors = {};
  let token;

  try {
    const capp = catalyst.initialize(req);
    const cache = capp.cache().segment();
    token = await getAccessToken(cache);

    // Isolate every section so one failure can't blank the whole payload;
    // any missing key makes the SPA fall back to its embedded sample.
    const withRetry = async (fn) => {
      try {
        return await fn();
      } catch (e) {
        if (e && e.code === 401) {
          const fresh = await refreshAccessToken();
          token = fresh.token;
          try { await cache.put(CACHE_KEY, token, 1); } catch (_) {}
          return fn();
        }
        throw e;
      }
    };

    // Memoise GETs by path so sections sharing a source (e.g. Use Cases and
    // Backlog both read native Tasks) hit the Zoho API only once per request.
    const jsonCache = new Map();
    const getJson = (path) => {
      if (!jsonCache.has(path)) jsonCache.set(path, withRetry(() => zohoGet(path, token)));
      return jsonCache.get(path);
    };

    // Each section lists one or more candidate [path, shape] sources tried in
    // order; the first that yields a non-empty array wins. Milestones and Use
    // Cases now read the NATIVE Milestones/Tasks modules first (the real source
    // of truth), falling back to the custom program_phase/use_case modules.
    const sections = [
      ['milestones', [
        [`/portal/${PORTAL_ID}/projects/${PROJECT_ID}/${MODULES.milestone}?per_page=200`, (j) => mapNativeMilestones(milestonesOf(j))],
        [`/portal/${PORTAL_ID}/${MODULES.programPhase}?project_id=${PROJECT_ID}&per_page=200`, (j) => mapMilestones(recordsOf(j))],
      ]],
      ['usecases', [
        [`/portal/${PORTAL_ID}/projects/${PROJECT_ID}/${MODULES.task}?per_page=200`, (j) => mapNativeTasks(tasksOf(j))],
        [`/portal/${PORTAL_ID}/${MODULES.useCase}?project_id=${PROJECT_ID}&per_page=200`, (j) => mapUsecases(recordsOf(j))],
      ]],
      ['backlog', [
        [`/portal/${PORTAL_ID}/projects/${PROJECT_ID}/${MODULES.task}?per_page=200`, (j) => mapNativeBacklog(tasksOf(j))],
      ]],
      ['risks', [
        [`/portal/${PORTAL_ID}/${MODULES.risk}?project_id=${PROJECT_ID}&per_page=200`, (j) => mapRisks(recordsOf(j))],
      ]],
      ['dependencies', [
        [`/portal/${PORTAL_ID}/${MODULES.dependency}?project_id=${PROJECT_ID}&per_page=200`, (j) => mapDependencies(recordsOf(j))],
      ]],
      ['vendors', [
        [`/portal/${PORTAL_ID}/${MODULES.vendor}?project_id=${PROJECT_ID}&per_page=200`, (j) => mapVendors(recordsOf(j))],
      ]],
      ['bugs', [
        [`/portal/${PORTAL_ID}/projects/${PROJECT_ID}/issues?per_page=200`, (j) => mapBugs(issuesOf(j))],
      ]],
    ];

    for (const [key, candidates] of sections) {
      let lastErr;
      for (const [path, shape] of candidates) {
        try {
          const json = await getJson(path);
          const arr = shape(json);
          if (Array.isArray(arr) && arr.length) { out[key] = arr; lastErr = undefined; break; }
        } catch (e) {
          lastErr = e;
        }
      }
      if (!out[key] && lastErr) errors[key] = String((lastErr && lastErr.message) || lastErr);
    }

    out.__meta = { source: 'zoho', portal: PORTAL_ID, project: PROJECT_ID, ts: new Date().toISOString() };
    if (Object.keys(errors).length) out.__meta.errors = errors;
    return res.status(200).json({ status: 'success', data: out });
  } catch (e) {
    // Total failure (bad creds / cache) — tell the SPA to use its fallback.
    return res.status(502).json({ status: 'error', message: String((e && e.message) || e) });
  }
});

app.get('/', (_req, res) => res.json({ status: 'ok', service: 'gta7-zoho-proxy', try: '/server/zoho-proxy/data' }));

module.exports = app;
