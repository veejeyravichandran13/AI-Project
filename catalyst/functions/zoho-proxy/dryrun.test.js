'use strict';
/* Offline dry-run: feed Zoho-shaped sample payloads (mirroring the records the
   onboarding created) through the pure mappers and assert the output matches
   the SPA's DATA shape. Run: `node dryrun.test.js` (no credentials needed). */

const assert = require('assert');
const m = require('./mappers');

// --- sample payloads (same field layout the live portal returns) ------------
const programPhases = { data: { records: [
  { name: 'M4 · Full Production', description: 'Phase Code: M4 | RAG Health: AMBER | Status: In progress · Q3 (62%) | Primary Outcome: World · Missions · Vehicles | Exit Criteria: World districts 8/14 shipped; Missions 34/72; Vehicles 61/140 | Gate Approver: Program Director' },
  { name: 'M0 · Vendor Selection & Kickoff', description: 'Phase Code: M0 | RAG Health: GREEN | Status: Complete (100%) | Primary Outcome: Contract signed | Exit Criteria: Rockstar can access source; Build the game | Gate Approver: Program Director' },
] } };

const issues = { data: { issues: [
  { name: 'GTA7-BUG-000123 · Wanted level remains active after player leaves search area',
    description: 'Priority: P1 | Build: 0.42.183 | Environment: PS5 DevKit | Reproducibility: 100% | Owner: AI Team | Status: In Progress | Fix Version: 0.42.191',
    severity: { value: 'S1' }, module: { value: 'AI' }, status: { name: 'Open' }, is_it_reproducible: { value: 'Always' } },
] } };

const usecases = { records: [
  { name: 'UC-POLICE-001 · Crime Detection', description: 'Area: AI / Police | Status: AMBER | Steps: 10 | Functional Req: NPC witnesses crime | Perf Req: Detection ≤ 200ms | Edge Cases: Witness killed mid-report; Crime during cutscene | Acceptance: Wanted level rises within 1s' },
] };

// Risks now carry structured custom fields (probability/impact/rag_health/…);
// the legacy blob is kept to prove structured values take precedence.
const risks = { records: [
  { name: 'R-02 · Performance below target',
    description: 'Probability: High | Impact: High | RAG: RED | Mitigation: old blob | Owner: old blob',
    probability: 'High', impact: 'High', rag_health: 'RED',
    mitigation_plan: 'Continuous early profiling; GPU frame-time budget per subsystem',
    risk_owner: 'Technical Director', risk_score: '9', risk_category: 'Technical',
    next_review_date: '2026-09-15' },
] };

const deps = { records: [
  { name: 'Multiplayer',
    description: 'Feature: Multiplayer | Depends On: old blob | Risk Level: old blob',
    linked_systems: ['Networking', 'Backend', 'Security'],
    dependency_type: 'Technical', dependency_status: 'At Risk',
    blocking_severity: 'High', dependency_owner: 'Online Services Lead',
    target_resolution_date: '2026-11-30' },
] };

const vendors = { records: [
  { name: 'Vendor A',
    description: 'Scope: World / Content Production | RAG: GREEN | Milestone: M4 · on track | Staff: 120 | Scorecard: AAA Track Record 5, Open-World 5, Security Maturity 4, DevOps 4, QA 4',
    deliverables: ['World Content'], contract_type: 'Managed Capacity',
    contract_value_m_usd: '42', sla_adherence_percentage: '97',
    region: 'North America', primary_contact: 'Jane Cortez — Studio Head',
    overall_score: 4.4, engagement_end: '2027-06-30' },
] };

// Native Milestones (Phases) — real shape returned by GET .../milestones.
// No RAG/percent fields, so the mapper derives them from the schedule vs. now.
const nativeMilestones = { data: { milestones: [
  { name: 'M0 · Vendor Selection & Kickoff', id: '10', start_date: '2026-01-05', end_date: '2026-02-28',
    status_type: 'open', status: { name: 'Active', is_closed: false } },
  { name: 'M3 · Vertical Slice', id: '13', start_date: '2026-09-01', end_date: '2026-12-31',
    status_type: 'open', status: { name: 'Active', is_closed: false } },
  { name: 'M9 · Launch', id: '19', start_date: '2028-10-01', end_date: '2028-11-15',
    status_type: 'open', status: { name: 'Active', is_closed: false } },
] } };

// Native Tasks — real shape returned by GET .../tasks (drives the Use Cases view).
const nativeTasks = { data: { tasks: [
  { name: 'Issue RFPs to shortlisted co-dev studios', prefix: 'GP1-T22',
    tasklist: { name: 'GTA7-EPIC-04 · Vendor Evaluation & Contracting' },
    milestone: { name: 'M0 · Vendor Selection & Kickoff' },
    priority: 'high', completion_percentage: 100, is_completed: true,
    status: { name: 'Closed', is_closed_type: true } },
  { name: 'Prototype police dispatch AI', prefix: 'GP1-T51',
    tasklist: { name: 'GTA7-EPIC-01 · Police & Wanted System' },
    priority: 'medium', completion_percentage: 40, is_completed: false,
    status: { name: 'In Progress', is_closed_type: false } },
] } };

// --- run mappers ------------------------------------------------------------
const ms = m.mapMilestones(m.recordsOf(programPhases));
// Fixed "today" so the schedule-derived RAG/percent are deterministic.
const NOW = new Date('2026-10-15T00:00:00Z');
const nms = m.mapNativeMilestones(m.milestonesOf(nativeMilestones), NOW);
const nts = m.mapNativeTasks(m.tasksOf(nativeTasks));
const nbl = m.mapNativeBacklog(m.tasksOf(nativeTasks));
const bugs = m.mapBugs(m.issuesOf(issues));
const ucs = m.mapUsecases(m.recordsOf(usecases));
const rs = m.mapRisks(m.recordsOf(risks));
const ds = m.mapDependencies(m.recordsOf(deps));
const vs = m.mapVendors(m.recordsOf(vendors));

// --- assertions: keys/shapes the SPA renders --------------------------------
const m4 = ms[0];
assert.deepStrictEqual(Object.keys(m4).sort(), ['code','criteria','date','exit','name','pct','status'].sort());
assert.strictEqual(m4.code, 'M4');
assert.strictEqual(m4.name, 'Full Production');
assert.strictEqual(m4.status, 'amber');
assert.strictEqual(m4.pct, 62);
assert.ok(Array.isArray(m4.exit) && m4.exit.length === 3);
assert.strictEqual(ms[1].pct, 100);
assert.strictEqual(ms[1].status, 'green');

const b = bugs[0];
assert.deepStrictEqual(Object.keys(b).sort(), ['area','build','env','fix','id','owner','prio','repro','sev','status','title'].sort());
assert.strictEqual(b.id, 'GTA7-BUG-000123');
assert.strictEqual(b.sev, 'S1');
assert.strictEqual(b.area, 'AI');
assert.strictEqual(b.prio, 'P1');
assert.strictEqual(b.fix, '0.42.191');
assert.ok(b.title.startsWith('Wanted level remains'));

const u = ucs[0];
assert.deepStrictEqual(Object.keys(u).sort(), ['accept','area','edge','fr','id','perf','status','steps','title'].sort());
assert.strictEqual(u.id, 'UC-POLICE-001');
assert.strictEqual(u.steps, 10);
assert.strictEqual(u.status, 'amber');
assert.ok(Array.isArray(u.edge) && u.edge.length === 2);

const r = rs[0];
assert.deepStrictEqual(Object.keys(r).sort(), ['category','id','impact','mit','owner','prob','rag','review','risk','score'].sort());
assert.strictEqual(r.id, 'R-02');
assert.strictEqual(r.rag, 'red');
assert.strictEqual(r.risk, 'Performance below target');
// structured custom fields win over the legacy blob
assert.strictEqual(r.owner, 'Technical Director');
assert.strictEqual(r.score, 9);
assert.strictEqual(r.category, 'Technical');
assert.strictEqual(r.review, '2026-09-15');
assert.ok(r.mit.startsWith('Continuous early profiling'));

const d = ds[0];
assert.deepStrictEqual(Object.keys(d).sort(), ['deps','feature','owner','severity','status','target','type'].sort());
assert.strictEqual(d.feature, 'Multiplayer');
assert.deepStrictEqual(d.deps, ['Networking', 'Backend', 'Security']);
assert.strictEqual(d.type, 'Technical');
assert.strictEqual(d.status, 'At Risk');
assert.strictEqual(d.severity, 'High');
assert.strictEqual(d.owner, 'Online Services Lead');

const v = vs[0];
assert.deepStrictEqual(Object.keys(v).sort(), ['contact','contractType','contractValue','deliverables','engagementEnd','milestone','name','overall','rag','region','scope','scores','sla','staff'].sort());
assert.strictEqual(v.name, 'Vendor A');
assert.strictEqual(v.staff, 120);
assert.strictEqual(v.rag, 'green');
assert.strictEqual(v.scores['AAA Track Record'], 5);
assert.strictEqual(v.scores['QA'], 4);
// new structured attributes
assert.strictEqual(v.contact, 'Jane Cortez — Studio Head');
assert.strictEqual(v.region, 'North America');
assert.strictEqual(v.contractType, 'Managed Capacity');
assert.strictEqual(v.contractValue, 42);
assert.strictEqual(v.sla, 97);
assert.strictEqual(v.overall, 4.4);
assert.deepStrictEqual(v.deliverables, ['World Content']);

// --- native Milestones: same DATA.milestones shape, derived RAG/percent ------
assert.deepStrictEqual(Object.keys(nms[0]).sort(), ['code','criteria','date','exit','name','pct','status'].sort());
// M0 ended before NOW -> complete/green.
assert.strictEqual(nms[0].code, 'M0');
assert.strictEqual(nms[0].name, 'Vendor Selection & Kickoff');
assert.strictEqual(nms[0].status, 'green');
assert.strictEqual(nms[0].pct, 100);
assert.strictEqual(nms[0].date, 'Complete');
// M3 spans NOW -> in progress/amber with a time-elapsed percent.
assert.strictEqual(nms[1].code, 'M3');
assert.strictEqual(nms[1].status, 'amber');
assert.ok(nms[1].pct > 0 && nms[1].pct < 100);
assert.ok(nms[1].date.startsWith('In progress'));
// M9 is still in the future -> planned/grey.
assert.strictEqual(nms[2].code, 'M9');
assert.strictEqual(nms[2].status, 'grey');
assert.strictEqual(nms[2].pct, 0);
assert.ok(nms[2].date.startsWith('Planned'));

// --- native Tasks -> DATA.usecases shape ------------------------------------
assert.deepStrictEqual(Object.keys(nts[0]).sort(), ['accept','area','edge','fr','id','perf','status','steps','title'].sort());
assert.strictEqual(nts[0].id, 'GP1-T22');
assert.strictEqual(nts[0].title, 'Issue RFPs to shortlisted co-dev studios');
assert.strictEqual(nts[0].status, 'green');          // completed
assert.ok(nts[0].area.startsWith('GTA7-EPIC-04'));   // task list becomes the area
assert.strictEqual(nts[1].id, 'GP1-T51');
assert.strictEqual(nts[1].status, 'amber');          // in progress (40%)
assert.strictEqual(nts[1].steps, 40);

// --- native Tasks -> DATA.backlog tree (Epic -> Task) -----------------------
// Two tasks in two different task lists -> two EPIC nodes.
assert.strictEqual(nbl.length, 2);
const epic = nbl.find((e) => e.id === 'GTA7-EPIC-04');
assert.ok(epic, 'expected an EPIC node from the task list');
assert.deepStrictEqual(Object.keys(epic).sort(), ['children','id','kind','owner','status','title'].sort());
assert.strictEqual(epic.kind, 'EPIC');
assert.strictEqual(epic.title, 'Vendor Evaluation & Contracting');
assert.strictEqual(epic.owner, 'M0 · Vendor Selection & Kickoff'); // phase shown as owner
assert.strictEqual(epic.status, 'green');            // its only task is complete
assert.strictEqual(epic.children.length, 1);
assert.strictEqual(epic.children[0].kind, 'TASK');
assert.strictEqual(epic.children[0].id, 'GP1-T22');
const epic1 = nbl.find((e) => e.id === 'GTA7-EPIC-01');
assert.strictEqual(epic1.status, 'amber');           // in-progress task rolls up amber

console.log('OK — proxy mappers produce the SPA DATA shape');
console.log(JSON.stringify({ milestones: ms.length, nativeMilestones: nms.length, bugs: bugs.length, usecases: ucs.length, nativeTasks: nts.length, risks: rs.length, dependencies: ds.length, vendors: vs.length }));
