# GTA-7 Program PMO — Zoho Catalyst app

Hosts the GTA-7 PMO single-page dashboard on **Zoho Catalyst Web Client Hosting**,
with the data served from the **live Zoho Projects portal** through a Catalyst
Function proxy. The browser never sees any OAuth secret.

```
catalyst/
├─ catalyst.json                 project binding (Project-GTA-7 · 86812000000014063)
├─ client/                       Web Client Hosting (the SPA)
│  ├─ index.html                 = gta7_pmo.html (hydrates from the proxy, embedded fallback)
│  └─ client-package.json
└─ functions/
   ├─ zoho-proxy/                Advanced I/O — GET /server/zoho-proxy/data
   │  ├─ index.js                reads Zoho Projects → reshapes into the SPA's DATA
   │  ├─ package.json
   │  └─ catalyst-config.json
   └─ token-rotate/             Basic I/O — refresh-token → access-token → Catalyst Cache
      ├─ index.js               (wire to a Catalyst Cron, ~every 50 min)
      ├─ package.json
      └─ catalyst-config.json
```

## Data flow

```
Browser (SPA)  ──GET /server/zoho-proxy/data──►  zoho-proxy (Catalyst Function)
                                                     │ access token (Catalyst Cache)
                                                     │   ▲ refreshed by token-rotate (cron)
                                                     ▼
                                              Zoho Projects  portal 760700236
                                              project 1856270000001966003 (GTA-7 Program)
```

The proxy returns JSON shaped to the SPA's `DATA.*` keys
(`milestones`, `bugs`, `usecases`, `risks`, `dependencies`, `vendors`). The SPA
overlays whatever the proxy returns onto its embedded sample and renders; any
key the proxy omits (or if the whole call fails) keeps the embedded value, so
the static copy still works.

## What lives where in Zoho (already created)

| SPA data          | Zoho object                                   |
|-------------------|-----------------------------------------------|
| `milestones`      | custom module `program_phase` (11 records)    |
| `usecases`        | custom module `use_case` (4)                  |
| `risks`           | custom module `custom_module1` "Risk Register" (8) |
| `dependencies`    | custom module `dependency` (6)                |
| `vendors`         | custom module `vendor` (4)                    |
| `bugs`            | native **Issues** (8, severity/module/reproducibility) |
| _(also created)_  | `change_request` (3), `test_case` (5), `build_release` (3) |
| Epics / tasks     | Task Lists (3) + Tasks hierarchy (21)         |

## Prerequisites

- Catalyst CLI: `npm i -g zcatalyst-cli` then `catalyst login`
- Node 18+ locally (functions target the `node18` stack)
- A Zoho **self-client / server-based** OAuth app with scope
  `ZohoProjects.projects.READ,ZohoProjects.tasks.READ,ZohoProjects.bugs.READ,ZohoProjects.custommodule.READ`
  and a **refresh token** for portal `760700236`.

### Generate the OAuth refresh token (one-time, done by you)

1. https://api-console.zoho.com → **Self Client** → generate a grant `code`
   with the scopes above.
2. Exchange the code for tokens:
   ```bash
   curl -X POST "https://accounts.zoho.com/oauth/v2/token" \
     -d "grant_type=authorization_code" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "code=THE_GRANT_CODE"
   ```
   Keep the `refresh_token` from the response (it does not expire).

> Data-centre note: if your portal is on `.in` / `.eu` / `.com.au`, use the
> matching `accounts.zoho.*` host for the steps above **and** set
> `ZOHO_ACCOUNTS_URL` / `ZOHO_PROJECTS_BASE` below accordingly.

## Configure environment variables (Catalyst console → Settings → Environment)

Set these on the **Development** environment (never commit them):

| Variable              | Value                                             |
|-----------------------|---------------------------------------------------|
| `ZOHO_CLIENT_ID`      | your OAuth client id                              |
| `ZOHO_CLIENT_SECRET`  | your OAuth client secret                          |
| `ZOHO_REFRESH_TOKEN`  | refresh token from the step above                 |
| `PORTAL_ID`           | `760700236`                                       |
| `PROJECT_ID`          | `1856270000001966003`                             |
| `ZOHO_ACCOUNTS_URL`   | _(optional)_ default `https://accounts.zoho.com`  |
| `ZOHO_PROJECTS_BASE`  | _(optional)_ default `https://projects.zoho.com/api/v3` |

## Deploy

```bash
cd catalyst
npm install --prefix functions/zoho-proxy
npm install --prefix functions/token-rotate
catalyst deploy
```

Front-end URL after deploy:
`https://project-gta-7-935983212.development.catalystserverless.com`

Proxy sanity check:
`https://project-gta-7-935983212.development.catalystserverless.com/server/zoho-proxy/data`

## Keep the token warm (optional but recommended)

Catalyst console → **Cron** → new cron → target the `token-rotate` function,
schedule every 50 minutes. The proxy also self-refreshes on a cold/expired
cache, so the cron is a warm-up optimisation, not a hard dependency.

## Local override for the front-end

The SPA calls `/server/zoho-proxy/data` by default. To point a local copy at a
deployed proxy, set before load:

```html
<script>window.GTA7_PROXY_URL = "https://project-gta-7-935983212.development.catalystserverless.com/server/zoho-proxy/data";</script>
```

## Security notes

- Secrets live only in Catalyst env vars + Catalyst Cache (server-side).
- The client bundle contains no tokens; it only knows the proxy path.
- The proxy is **read-only** against Zoho Projects.
