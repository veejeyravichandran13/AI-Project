'use strict';
/**
 * One-off backfill: set the new Tasks custom-field values (Discipline,
 * Target Platforms, QA State) on the six GTA-7 tasks.
 *
 * Why this exists: the field SCHEMA (picklist `discipline`, `qa_state` and
 * multipicklist `target_platforms`) is already created and registered to the
 * project, but Zoho's Tasks-module write validator was intermittently rejecting
 * value writes with:
 *     400 FIELDS_VALIDATION_ERROR — "the mentioned parameter is not available
 *     for the project"
 * That is a server-side layout-validation lag; it converges on Zoho's side.
 * This script simply retries the same PATCH until it lands, so you can run it
 * unattended and let it finish once the validator clears.
 *
 * Run:
 *   ZOHO_CLIENT_ID=...  ZOHO_CLIENT_SECRET=...  ZOHO_REFRESH_TOKEN=... \
 *   node backfill-task-fields.js
 *
 * Optional env overrides:
 *   PORTAL_ID           (default 760700236)
 *   PROJECT_ID          (default 1856270000001966003 — GTA-7 Program)
 *   ZOHO_ACCOUNTS_URL   (default https://accounts.zoho.com)
 *   ZOHO_PROJECTS_BASE  (default https://projects.zoho.com/api/v3)
 *   MAX_ATTEMPTS        (per-task retry cap, default 40)
 *   RETRY_DELAY_MS      (wait between retries, default 15000)
 *
 * Needs Node 18+ (global fetch). No dependencies.
 */

const ENV = process.env;
const PORTAL_ID = ENV.PORTAL_ID || '760700236';
const PROJECT_ID = ENV.PROJECT_ID || '1856270000001966003';
const ACCOUNTS_URL = (ENV.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com').replace(/\/+$/, '');
const PROJECTS_BASE = (ENV.ZOHO_PROJECTS_BASE || 'https://projects.zoho.com/api/v3').replace(/\/+$/, '');
const MAX_ATTEMPTS = Number(ENV.MAX_ATTEMPTS) || 40;
const RETRY_DELAY_MS = Number(ENV.RETRY_DELAY_MS) || 15000;

// task_id -> custom-field values (field_name keys, from get_fields on `tasks`)
const BACKFILL = [
  { id: '1856270000001966092', discipline: 'World/Streaming',   target_platforms: ['PS5', 'Xbox Series X|S', 'PC'],                     qa_state: 'In Dev' },
  { id: '1856270000001968018', discipline: 'AI/Gameplay',       target_platforms: ['PS5', 'Xbox Series X|S', 'PC', 'Cloud/Streaming'],  qa_state: 'In QA'  },
  { id: '1856270000001970006', discipline: 'Mission/Narrative', target_platforms: ['PS5', 'Xbox Series X|S', 'PC'],                     qa_state: 'In QA'  },
  { id: '1856270000001969010', discipline: 'AI/Gameplay',       target_platforms: ['PS5', 'Xbox Series X|S', 'PC'],                     qa_state: 'In Dev' },
  { id: '1856270000001968028', discipline: 'Engine/Rendering',  target_platforms: ['PS5', 'Xbox Series X|S', 'PC'],                     qa_state: 'In Dev' },
  { id: '1856270000001967023', discipline: 'World/Streaming',   target_platforms: ['PS5', 'Xbox Series X|S', 'PC'],                     qa_state: 'In Dev' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getAccessToken() {
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
  return json.access_token;
}

async function patchTask(token, task) {
  const { id, ...fields } = task;
  const url = `${PROJECTS_BASE}/portal/${PORTAL_ID}/projects/${PROJECT_ID}/tasks/${id}`;
  const resp = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(fields),
  });
  const text = await resp.text();
  return { ok: resp.ok, status: resp.status, body: text };
}

// The validator lag surfaces as this specific transient error; keep retrying.
function isTransientLag(res) {
  return res.status === 400 && /not available for the project/i.test(res.body);
}

async function main() {
  let token = await getAccessToken();
  console.log(`Backfilling ${BACKFILL.length} tasks in project ${PROJECT_ID} …`);

  const results = [];
  for (const task of BACKFILL) {
    let landed = false;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      let res = await patchTask(token, task);

      // Refresh once on a 401 (expired token) and retry immediately.
      if (res.status === 401) {
        token = await getAccessToken();
        res = await patchTask(token, task);
      }

      if (res.ok) {
        console.log(`  ✓ ${task.id} set (attempt ${attempt})`);
        landed = true;
        break;
      }
      if (isTransientLag(res)) {
        console.log(`  … ${task.id} validator cold (attempt ${attempt}/${MAX_ATTEMPTS}); waiting ${RETRY_DELAY_MS}ms`);
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      // Any other error is real — surface it and stop retrying this task.
      console.error(`  ✗ ${task.id} failed: HTTP ${res.status} ${res.body}`);
      break;
    }
    results.push({ id: task.id, ok: landed });
  }

  const done = results.filter((r) => r.ok).length;
  console.log(`\nDone: ${done}/${results.length} tasks backfilled.`);
  if (done !== results.length) {
    console.log('Unlanded tasks can be re-run (or set in the Zoho UI, which uses a different write path).');
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error('Fatal:', (e && e.message) || e);
  process.exitCode = 1;
});
