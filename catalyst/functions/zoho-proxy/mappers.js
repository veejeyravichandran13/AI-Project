'use strict';

/**
 * Pure reshaping helpers: Zoho Projects records/issues -> the SPA's DATA shape.
 * Kept side-effect free so they can be unit-tested without live credentials
 * (see dryrun.test.js).
 */

const recordsOf = (j) => (j && (j.records || (j.data && j.data.records) || j.data)) || [];
const issuesOf = (j) => (j && (j.issues || (j.data && j.data.issues) || j.data)) || [];
/* Native Milestones (a.k.a. Phases) come back under a `milestones` array; native
 * Tasks under a `tasks` array. Both may be wrapped in `data`. */
const milestonesOf = (j) => (j && (j.milestones || (j.data && j.data.milestones) || j.records || (j.data && j.data.records) || j.data)) || [];
const tasksOf = (j) => (j && (j.tasks || (j.data && j.data.tasks) || j.records || (j.data && j.data.records) || j.data)) || [];

/* Parse a "Key: value | Key: value" description blob into a lookup map. */
function parseKV(desc) {
  const out = {};
  String(desc || '').split('|').forEach((seg) => {
    const i = seg.indexOf(':');
    if (i > -1) out[seg.slice(0, i).trim().toLowerCase()] = seg.slice(i + 1).trim();
  });
  return out;
}

function ragFromWord(w) {
  const s = String(w || '').toLowerCase();
  if (s.includes('red')) return 'red';
  if (s.includes('amber')) return 'amber';
  if (s.includes('green')) return 'green';
  return 'grey';
}

/* Map a Zoho status NAME (the project's custom pipeline) to a dashboard RAG.
 * Tasks:  Backlog/Open → grey · In Design/In Progress/In Review/In Certification
 *         → amber · Content Complete/Shipped/Closed → green · Blocked → red.
 * Phases: Not Started → grey · Gate Review/At Risk/Active → amber · On Track/
 *         Gate Passed → green · Blocked → red.
 * Returns '' when the name is unknown so callers can fall back to their
 * completion-/schedule-based heuristic. */
function ragFromStatusName(name) {
  const s = String(name || '').toLowerCase().trim();
  if (!s) return '';
  if (s.includes('block')) return 'red';
  if (s.includes('shipped') || s.includes('content complete') || s.includes('closed')
    || s.includes('gate passed') || s.includes('on track') || s.includes('done')
    || s.includes('complete')) return 'green';
  if (s.includes('progress') || s.includes('review') || s.includes('certification')
    || s.includes('design') || s.includes('testing') || s.includes('at risk')) return 'amber';
  if (s.includes('backlog') || s.includes('not started')
    || s.includes('todo') || s.includes('to do')) return 'grey';
  // Generic Zoho defaults (Active/Open/New) are intentionally left unmapped so
  // callers fall back to the completion-/schedule-based heuristic.
  return '';
}

/* Return the first value that is a non-empty string/number/array. Lets the
 * mappers prefer real structured custom fields and fall back to the legacy
 * pipe-delimited description blob when a field was never populated. */
function pick(...vals) {
  for (const v of vals) {
    if (v === 0) return v;
    if (Array.isArray(v)) { if (v.length) return v; continue; }
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return '';
}

/* Normalise a Zoho multi/single value into a clean array of strings. Accepts a
 * real array (multipicklist), a comma/semicolon string, or empty. */
function toList(v, sep = /[,;]/) {
  if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
  return String(v || '').split(sep).map((s) => s.trim()).filter(Boolean);
}

/* Flatten an HTML/rich-text blob (native task descriptions) into plain text. */
const stripHtml = (s) => String(s || '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/\s+/g, ' ')
  .trim();

function mapMilestones(records) {
  return records.map((r) => {
    const kv = parseKV(r.description);
    const name = String(r.name || '');
    const code = (kv['phase code'] || (name.split('·')[0] || '').trim() || name).trim();
    const label = name.includes('·') ? name.split('·').slice(1).join('·').trim() : name;
    const status = kv['status'] || '';
    const pctMatch = status.match(/(\d+)\s*%/);
    return {
      code,
      name: label,
      date: status.replace(/\s*\(\d+%\)\s*$/, '').trim() || '—',
      status: ragFromWord(kv['rag health']),
      pct: pctMatch ? Number(pctMatch[1]) : 0,
      criteria: kv['primary outcome'] || '',
      exit: (kv['exit criteria'] || '').split(';').map((s) => s.trim()).filter(Boolean),
    };
  });
}

/* NATIVE Milestones (Phases) -> DATA.milestones.
 * The native module has real start_date/end_date/status but no RAG or %, so we
 * derive them from the schedule vs. today. Any of the richer fields can still be
 * supplied through the phase description KV blob (Phase Code / RAG Health /
 * Status / Primary Outcome / Exit Criteria) and, when present, take precedence.
 * `now` is injectable so the mapping is deterministic under test. */
function mapNativeMilestones(rows, now) {
  const today = now || new Date();
  const toDate = (d) => {
    if (!d) return null;
    const s = String(d);
    const dt = new Date(s.length <= 10 ? s + 'T00:00:00Z' : s);
    return Number.isNaN(dt.getTime()) ? null : dt;
  };
  const ymd = (d) => (d ? d.toISOString().slice(0, 10) : '');
  return rows.map((r) => {
    const kv = parseKV(r.description);
    const name = String(r.name || '');
    const code = (kv['phase code'] || (name.split('·')[0] || '').trim() || name).trim();
    const label = name.includes('·') ? name.split('·').slice(1).join('·').trim() : name;
    const start = toDate(r.start_date);
    const end = toDate(r.end_date);
    const closed = !!(r.status && r.status.is_closed) || r.status_type === 'closed';

    // RAG: explicit "RAG Health" wins; else the phase's live status NAME (gate
    // pipeline: Not Started/Gate Review/At Risk/On Track/Gate Passed/Blocked);
    // else derived from schedule — past=green, current=amber, future=grey.
    let rag = ragFromWord(kv['rag health']);
    if (!kv['rag health']) {
      const byName = ragFromStatusName(r.status && r.status.name);
      if (byName) rag = byName;
      else if (closed || (end && end < today)) rag = 'green';
      else if (start && start <= today && (!end || today <= end)) rag = 'amber';
      else rag = 'grey';
    }

    // Percent: description override wins; else 100 when done/past, time-elapsed
    // estimate while active, 0 while still in the future.
    let pct;
    const kvPct = String(kv['status'] || '').match(/(\d+)\s*%/);
    if (kvPct) pct = Number(kvPct[1]);
    else if (closed || (end && end < today)) pct = 100;
    else if (start && end && end > start && today > start) {
      pct = Math.round(Math.min(100, Math.max(0, ((today - start) / (end - start)) * 100)));
    } else pct = 0;

    // Human date label: prefer the description "Status" text; else a derived state.
    const done = closed || (end && end < today);
    const kvDate = String(kv['status'] || '').replace(/\s*\(\d+%\)\s*$/, '').trim();
    const dateLabel = kvDate
      || (done ? 'Complete'
        : (start && start > today) ? ('Planned · ' + ymd(start))
          : ('In progress · ' + ymd(start) + ' → ' + ymd(end)));

    return {
      code,
      name: label,
      date: dateLabel || '—',
      status: rag,
      pct,
      criteria: kv['primary outcome'] || '',
      exit: String(kv['exit criteria'] || '').split(';').map((s) => s.trim()).filter(Boolean),
    };
  });
}

function mapBugs(issues) {
  return issues.map((it) => {
    const kv = parseKV(it.description);
    const name = String(it.name || '');
    const parts = name.split('·');
    return {
      id: (parts[0] || name).trim(),
      title: parts.slice(1).join('·').trim() || name,
      sev: (it.severity && it.severity.value) || kv['severity'] || '',
      prio: kv['priority'] || '',
      area: (it.module && it.module.value) || kv['area'] || '',
      env: kv['environment'] || '',
      build: kv['build'] || '',
      repro: kv['reproducibility'] || (it.is_it_reproducible && it.is_it_reproducible.value) || '',
      owner: kv['owner'] || '',
      status: (it.status && it.status.name) || kv['status'] || '',
      fix: kv['fix version'] || '—',
    };
  });
}

function mapUsecases(records) {
  return records.map((r) => {
    const kv = parseKV(r.description);
    const name = String(r.name || '');
    const parts = name.split('·');
    return {
      id: (parts[0] || name).trim(),
      title: parts.slice(1).join('·').trim() || name,
      area: kv['area'] || '',
      status: ragFromWord(kv['status']),
      steps: Number(kv['steps']) || 0,
      fr: kv['functional req'] || '',
      perf: kv['perf req'] || '',
      edge: (kv['edge cases'] || '').split(';').map((s) => s.trim()).filter(Boolean),
      accept: kv['acceptance'] || '',
    };
  });
}

/* NATIVE Tasks -> DATA.usecases (the SPA's "Use Cases" view). A task's prefix
 * (e.g. GP1-T22) becomes the id, its task-list/phase becomes the area, and its
 * completion/status drives the RAG. Optional KV keys in the description (Area /
 * Status / Steps / Functional Req / Perf Req / Edge Cases / Acceptance) enrich
 * the card when present. */
function mapNativeTasks(rows) {
  return rows.map((r) => {
    const kv = parseKV(r.description);
    const name = String(r.name || '');
    const hasSep = name.includes('·');
    const id = String(r.prefix || (hasSep ? name.split('·')[0] : name) || name).trim();
    const title = (hasSep ? name.split('·').slice(1).join('·').trim() : name) || name;
    const pct = Number(r.completion_percentage) || 0;

    // Priority: explicit KV "Status" RAG word → the task's live status NAME →
    // completion/close heuristic.
    let rag = kv['status'] ? ragFromWord(kv['status']) : taskRag(r);

    return {
      id,
      title,
      area: pick(kv['area'], r.tasklist && r.tasklist.name, r.milestone && r.milestone.name),
      status: rag,
      steps: Number(kv['steps']) || pct || 0,
      fr: pick(kv['functional req'], stripHtml(r.description)),
      perf: pick(kv['perf req'], r.priority ? ('Priority: ' + r.priority) : ''),
      edge: String(kv['edge cases'] || '').split(';').map((s) => s.trim()).filter(Boolean),
      accept: pick(kv['acceptance'], r.status && r.status.name ? ('Status: ' + r.status.name) : ''),
    };
  });
}

/* RAG for a single native task. The live status NAME (project pipeline:
 * Backlog/In Design/In Progress/In Review/In Certification/Content Complete/
 * Shipped/Blocked) drives the colour; if the name is unrecognised we fall back
 * to the completion/close heuristic. */
function taskRag(r) {
  const byName = ragFromStatusName(r.status && r.status.name);
  if (byName) return byName;
  const closed = !!(r.is_completed || (r.status && r.status.is_closed_type));
  const pct = Number(r.completion_percentage) || 0;
  return closed ? 'green' : (pct > 0 ? 'amber' : 'grey');
}

/* NATIVE Tasks -> DATA.backlog (the SPA's "Product Backlog" tree). Tasks are
 * grouped under their Task List, which becomes an EPIC node; each task is a
 * child TASK node. The epic's RAG rolls up from its tasks. The owning phase is
 * shown as the epic's owner pill. */
function mapNativeBacklog(rows) {
  const groups = new Map();
  rows.forEach((r) => {
    const key = (r.tasklist && (r.tasklist.id || r.tasklist.name)) || 'general';
    if (!groups.has(key)) {
      groups.set(key, {
        name: (r.tasklist && r.tasklist.name) || 'General',
        phase: (r.milestone && r.milestone.name) || '',
        tasks: [],
      });
    }
    groups.get(key).tasks.push(r);
  });

  const rollup = (tasks) => {
    const rags = tasks.map(taskRag);
    if (rags.includes('red')) return 'red';
    if (rags.length && rags.every((x) => x === 'green')) return 'green';
    if (rags.includes('amber')) return 'amber';
    return 'grey';
  };

  const out = [];
  groups.forEach((g) => {
    const nm = String(g.name || '');
    const hasSep = nm.includes('·');
    out.push({
      kind: 'EPIC',
      id: (hasSep ? nm.split('·')[0] : nm).trim(),
      title: (hasSep ? nm.split('·').slice(1).join('·') : nm).trim(),
      owner: g.phase,
      status: rollup(g.tasks),
      children: g.tasks.map((r) => {
        const name = String(r.name || '');
        const sep = name.includes('·');
        return {
          kind: 'TASK',
          id: String(r.prefix || (sep ? name.split('·')[0] : name) || name).trim(),
          title: (sep ? name.split('·').slice(1).join('·') : name).trim(),
          status: taskRag(r),
        };
      }),
    });
  });
  return out;
}

function mapRisks(records) {
  return records.map((r) => {
    const kv = parseKV(r.description);
    const name = String(r.name || '');
    const parts = name.split('·');
    const score = pick(r.risk_score, kv['risk score']);
    return {
      id: (parts[0] || name).trim(),
      risk: parts.slice(1).join('·').trim() || name,
      prob: pick(r.probability, kv['probability']),
      impact: pick(r.impact, kv['impact']),
      rag: ragFromWord(pick(r.rag_health, kv['rag'])),
      mit: pick(r.mitigation_plan, kv['mitigation']),
      owner: pick(r.risk_owner, kv['owner']),
      // New structured attributes now sourced directly from custom fields.
      category: pick(r.risk_category, kv['category']),
      score: score === '' ? 0 : Number(score),
      review: pick(r.next_review_date, kv['review date']),
    };
  });
}

function mapDependencies(records) {
  return records.map((r) => {
    const kv = parseKV(r.description);
    const deps = pick(
      toList(r.linked_systems),
      toList(kv['depends on']),
    );
    return {
      feature: pick(kv['feature'], r.name),
      deps: Array.isArray(deps) ? deps : [],
      // New structured attributes.
      type: pick(r.dependency_type, kv['type']),
      status: pick(r.dependency_status, kv['status']),
      severity: pick(r.blocking_severity, kv['risk level']),
      owner: pick(r.dependency_owner, kv['owner']),
      target: pick(r.target_resolution_date, kv['target']),
    };
  });
}

function mapVendors(records) {
  return records.map((r) => {
    const kv = parseKV(r.description);
    // Legacy scorecard blob (kept as a fallback for the radar/scores view).
    const scores = {};
    String(kv['scorecard'] || '').split(',').forEach((seg) => {
      const m = seg.trim().match(/^(.*?)(\d+)$/);
      if (m) scores[m[1].trim()] = Number(m[2]);
    });
    const staff = pick(r.staff_count, kv['staff']);
    const value = pick(r.contract_value_m_usd, kv['contract value']);
    const sla = pick(r.sla_adherence_percentage, kv['sla']);
    const overall = pick(r.overall_score, kv['overall']);
    const deliverables = toList(r.deliverables);
    return {
      name: String(r.name || ''),
      // `scope` stays a display string (blob); `deliverables` is the new
      // structured multi-select list.
      scope: pick(kv['scope'], deliverables.join(', ')),
      rag: ragFromWord(pick(r.rag_health, kv['rag'])),
      milestone: pick(r.milestone, kv['milestone']),
      staff: staff === '' ? 0 : Number(staff),
      scores,
      // New structured attributes.
      deliverables,
      contact: pick(r.primary_contact, kv['contact']),
      region: pick(r.region, kv['region']),
      contractType: pick(r.contract_type, kv['contract type']),
      contractValue: value === '' ? 0 : Number(value),
      sla: sla === '' ? 0 : Number(sla),
      engagementEnd: pick(r.engagement_end, kv['engagement end']),
      overall: overall === '' ? 0 : Number(overall),
    };
  });
}

module.exports = {
  recordsOf, issuesOf, milestonesOf, tasksOf, parseKV, ragFromWord, ragFromStatusName, pick, toList, stripHtml,
  mapMilestones, mapNativeMilestones, mapBugs, mapUsecases, mapNativeTasks,
  mapNativeBacklog, taskRag, mapRisks, mapDependencies, mapVendors,
};
