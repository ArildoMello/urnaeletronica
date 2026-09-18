import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyBallot, countBallots, simulateResult } from '../js/domain.js';
import { createSheetsApi } from '../js/sheets-api.js';
import { createSessionStore } from '../js/storage.js';

test('classifies the original candidate codes and an invalid number', () => {
  assert.equal(classifyBallot('13').kind, '13');
  assert.equal(classifyBallot('22').kind, '22');
  assert.equal(classifyBallot('99').kind, 'nulo');
});

test('simulation preserves the overall total and makes 13 lead for an even valid total', () => {
  const actual = countBallots(['22', '22', '22', '13', 'branco', '99']);
  const shown = simulateResult(actual);

  assert.equal(shown.total, 6);
  assert.equal(shown['13'], 3);
  assert.equal(shown['22'], 1);
  assert.equal(shown.branco, 1);
  assert.equal(shown.nulo, 1);
});

test('with valid votes, simulation makes 13 lead while retaining total', () => {
  const shown = simulateResult(countBallots(['22', '22', '13', 'branco']));
  assert.deepEqual(shown, { '13': 2, '22': 1, branco: 1, nulo: 0, total: 4 });
});

test('zero valid votes leaves both candidates at zero', () => {
  assert.deepEqual(simulateResult(countBallots(['branco', '99'])),
    { '13': 0, '22': 0, branco: 1, nulo: 1, total: 2 });
});

test('sends one complete general vote to the configured script endpoint', async () => {
  let received;
  const api = createSheetsApi({
    url: 'https://example.test/script',
    key: 'shared-key',
    fetchImpl: async (_url, options) => {
      received = JSON.parse(options.body);
      return new Response(JSON.stringify({ ok: true, records: [] }), { status: 200 });
    },
  });

  await api.registerVote({ kind: '13', sessionId: 'session-a', mode: 'session' });
  assert.deepEqual(received, {
    action: 'registrarVoto', key: 'shared-key', vote: { kind: '13', sessionId: 'session-a', mode: 'session' },
  });
});

test('turns a rejected general vote into a useful error', async () => {
  const api = createSheetsApi({
    url: 'https://example.test/script', key: 'shared-key',
    fetchImpl: async () => new Response(JSON.stringify({ ok: false, message: 'Chave inválida.' }), { status: 403 }),
  });

  await assert.rejects(api.registerVote({ kind: '22', sessionId: 'session-b' }), /Chave inválida/);
});

test('session votes only exist in the current browser-store instance', () => {
  const first = createSessionStore();
  first.add({ kind: '13' });

  assert.equal(first.all().length, 1);
  assert.equal(createSessionStore().all().length, 0);
});
