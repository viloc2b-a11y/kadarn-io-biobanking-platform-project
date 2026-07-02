// ==========================================================================
// Evidence Discovery — Persistence Tests
// ==========================================================================
// Sprint 20A.2. KEMS-002 / KEMS-002A.
// Tests the repository layer with an in-memory fake DbClient.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  createSession,
  createRun,
  createArtifact,
  createLayer1,
  createCandidate,
  createTransitionEvent,
  getCandidateById,
  getTransitionEvents,
  getCandidatesByRun,
  updateCandidateState,
} from '../src/repository.js';


// --------------------------------------------------------------------------
// In-memory fake DbClient
// --------------------------------------------------------------------------

function fakeDb(): DbClient & { _tables: Record<string, any> } {
  const tables: Record<string, any> = {};

  const db: any = {
    _tables: tables,
    from(table: string) {
      if (!tables[table]) tables[table] = {};
      const rows = tables[table];
      return {
        async insert(data: any) {
          const record = Array.isArray(data) ? data[0] : data;
          const id = (record.id as string) ?? crypto.randomUUID();
          rows[id] = { ...record, id };
          return { data: rows[id], error: null };
        },
        select(_cols: string) {
          return {
            async eq(col: string, val: unknown) {
              const results = Object.values(rows).filter((r: any) => r[col] === val);
              return { data: results, error: null };
            },
          };
        },
      };
    },
    async rpc(_fn: string, _params: any) {
      return { data: null, error: null };
    },
  };
  return db;
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('Discovery Persistence — Session', () => {
  it('creates a discovery session', async () => {
    const db = fakeDb();
    const session = await createSession(db, {
      organizationId: 'org-1', createdBy: 'actor-1', correlationId: 'corr-1',
    });
    expect(session.id).toBeDefined();
  });
});

describe('Discovery Persistence — Run', () => {
  it('creates a run under a session', async () => {
    const db = fakeDb();
    const session = await createSession(db, { organizationId: 'org-1', createdBy: 'a', correlationId: 'c' });
    const run = await createRun(db, { sessionId: session.id, pipelineVersion: 'discovery-v0.1.0' });
    expect(run.id).toBeDefined();
  });
});

describe('Discovery Persistence — Artifact (Layer 0)', () => {
  it('creates an artifact under a run', async () => {
    const db = fakeDb();
    const session = await createSession(db, { organizationId: 'org-1', createdBy: 'a', correlationId: 'c' });
    const run = await createRun(db, { sessionId: session.id, pipelineVersion: 'v1' });

    const artifact = await createArtifact(db, {
      runId: run.id, fileName: 'sop_v3.pdf', artifactType: 'pdf',
      sizeBytes: 102400, fileHash: 'abc123', source: 'upload', storageRef: '/uploads/sop_v3.pdf',
    });
    expect(artifact.id).toBeDefined();
  });
});

describe('Discovery Persistence — Layer 1', () => {
  it('creates Layer 1 referencing Layer 0', async () => {
    const db = fakeDb();
    const session = await createSession(db, { organizationId: 'org-1', createdBy: 'a', correlationId: 'c' });
    const run = await createRun(db, { sessionId: session.id, pipelineVersion: 'v1' });
    const artifact = await createArtifact(db, { runId: run.id, fileName: 'test.pdf', artifactType: 'pdf', sizeBytes: 100, fileHash: 'h1', source: 'upload', storageRef: '/t.pdf' });

    const l1 = await createLayer1(db, {
      artifactId: artifact.id, markdown: '# Extracted content', extractor: 'markitdown', extractorVersion: '1.0', originalHash: 'h1',
    });
    expect(l1.id).toBeDefined();
  });
});

describe('Discovery Persistence — Evidence Candidate', () => {
  it('creates a candidate with artifact links', async () => {
    const db = fakeDb();
    const session = await createSession(db, { organizationId: 'org-1', createdBy: 'a', correlationId: 'c' });
    const run = await createRun(db, { sessionId: session.id, pipelineVersion: 'v1' });
    const artifact = await createArtifact(db, { runId: run.id, fileName: 'a.pdf', artifactType: 'pdf', sizeBytes: 100, fileHash: 'h', source: 'upload', storageRef: '/a.pdf' });

    const candidate = await createCandidate(db, {
      runId: run.id, content: 'Evidence candidate from SOP', source: 'upload', artifactIds: [artifact.id], discoveryConfidence: 0.8,
    });
    expect(candidate.id).toBeDefined();
  });

  it('retrieves a candidate by ID', async () => {
    const db = fakeDb();
    const session = await createSession(db, { organizationId: 'org-1', createdBy: 'a', correlationId: 'c' });
    const run = await createRun(db, { sessionId: session.id, pipelineVersion: 'v1' });
    const artifact = await createArtifact(db, { runId: run.id, fileName: 'a.pdf', artifactType: 'pdf', sizeBytes: 100, fileHash: 'h', source: 'upload', storageRef: '/a.pdf' });
    const candidate = await createCandidate(db, { runId: run.id, content: 'Test', source: 'upload', artifactIds: [artifact.id] });

    const retrieved = await getCandidateById(db, candidate.id);
    expect(retrieved).not.toBeNull();
  });
});

describe('Discovery Persistence — Transition Events (append-only)', () => {
  it('creates a transition event', async () => {
    const db = fakeDb();
    const session = await createSession(db, { organizationId: 'org-1', createdBy: 'a', correlationId: 'c' });
    const run = await createRun(db, { sessionId: session.id, pipelineVersion: 'v1' });
    const artifact = await createArtifact(db, { runId: run.id, fileName: 'a.pdf', artifactType: 'pdf', sizeBytes: 100, fileHash: 'h', source: 'upload', storageRef: '/a.pdf' });
    const candidate = await createCandidate(db, { runId: run.id, content: 'Test', source: 'upload', artifactIds: [artifact.id] });

    const event = await createTransitionEvent(db, {
      candidateId: candidate.id, fromState: 'RAW_SOURCE', toState: 'DISCOVERED',
      actor: 'pipeline', pipelineVersion: 'v1', reason: 'Pipeline started',
    });
    expect(event.id).toBeDefined();
  });

  it('retrieves transition history for a candidate', async () => {
    const db = fakeDb();
    const session = await createSession(db, { organizationId: 'org-1', createdBy: 'a', correlationId: 'c' });
    const run = await createRun(db, { sessionId: session.id, pipelineVersion: 'v1' });
    const artifact = await createArtifact(db, { runId: run.id, fileName: 'a.pdf', artifactType: 'pdf', sizeBytes: 100, fileHash: 'h', source: 'upload', storageRef: '/a.pdf' });
    const candidate = await createCandidate(db, { runId: run.id, content: 'Test', source: 'upload', artifactIds: [artifact.id] });

    await createTransitionEvent(db, { candidateId: candidate.id, fromState: 'RAW_SOURCE', toState: 'DISCOVERED', actor: 'p', pipelineVersion: 'v1', reason: 'Step 1' });
    await createTransitionEvent(db, { candidateId: candidate.id, fromState: 'DISCOVERED', toState: 'CLASSIFIED', actor: 'p', pipelineVersion: 'v1', reason: 'Step 2' });

    const events = await getTransitionEvents(db, candidate.id);
    expect(events.length).toBe(2);
  });

  it('reconstructs candidate lifecycle from events', async () => {
    const db = fakeDb();
    const session = await createSession(db, { organizationId: 'org-1', createdBy: 'a', correlationId: 'c' });
    const run = await createRun(db, { sessionId: session.id, pipelineVersion: 'v1' });
    const artifact = await createArtifact(db, { runId: run.id, fileName: 'a.pdf', artifactType: 'pdf', sizeBytes: 100, fileHash: 'h', source: 'upload', storageRef: '/a.pdf' });
    const candidate = await createCandidate(db, { runId: run.id, content: 'Test', source: 'upload', artifactIds: [artifact.id] });

    const states = ['DISCOVERED', 'CLASSIFIED', 'ENTITY_EXTRACTED', 'CLAIMS_PROPOSED', 'CURATION', 'ENRICHED', 'READY_FOR_PROMOTION', 'PROMOTED'];
    for (const state of states) {
      await createTransitionEvent(db, {
        candidateId: candidate.id, fromState: state === 'DISCOVERED' ? 'RAW_SOURCE' : states[states.indexOf(state) - 1],
        toState: state, actor: 'p', pipelineVersion: 'v1', reason: `→ ${state}`,
      });
      await updateCandidateState(db, candidate.id, state);
    }

    const events = await getTransitionEvents(db, candidate.id);
    expect(events.length).toBe(8);
  });
});
