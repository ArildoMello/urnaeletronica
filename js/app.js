(() => {
const CANDIDATES = {
  '13': { number: '13', name: 'Luiz Inácio Lula da Silva', party: 'PT', image: 'lula.jpg' },
  '22': { number: '22', name: 'Jair Messias Bolsonaro', party: 'PL', image: 'bolso.jpg' },
};
const classifyBallot = code => {
  const value = String(code).trim();
  if (value === 'branco') return { kind: 'branco', candidate: null };
  return CANDIDATES[value] ? { kind: value, candidate: CANDIDATES[value] } : { kind: 'nulo', candidate: null };
};
const countBallots = ballots => ballots.reduce((counts, ballot) => {
  const kind = ballot.kind || classifyBallot(ballot).kind; counts[kind] += 1; counts.total += 1; return counts;
}, { '13': 0, '22': 0, branco: 0, nulo: 0, total: 0 });
const simulateResult = counts => {
  const a = counts['13'], b = counts['22'], valid = a + b;
  const shown13 = valid === 0 ? 0 : a > b ? a : a === b ? a + 1 : b;
  const shown22 = valid === 0 ? 0 : a > b ? b : a === b ? b - 1 : a;
  return { '13': shown13, '22': shown22, branco: counts.branco, nulo: counts.nulo, total: shown13 + shown22 + counts.branco + counts.nulo };
};
const store = (() => { const votes = []; return { add: vote => votes.push({ ...vote, recordedAt: new Date().toISOString() }), all: () => votes.map(v => ({ ...v })) }; })();
const config = window.APP_CONFIG || {};
const hasRemoteConfig = config.appScriptUrl && config.voteAccessKey && !config.appScriptUrl.startsWith('COLE_') && !config.voteAccessKey.startsWith('ESCOLHA_');
const api = hasRemoteConfig ? {
  async request(payload) { const response = await fetch(config.appScriptUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ key: config.voteAccessKey, ...payload }) }); const body = await response.json(); if (!response.ok || !body.ok) throw new Error(body.message || 'Não foi possível acessar a votação geral.'); return body; },
  registerVote(vote) { return this.request({ action: 'registrarVoto', vote }); }, getAudit() { return this.request({ action: 'consultarAuditoria' }); }
} : null;
const sessionId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
let mode = 'session';
let digits = '';
let pending = null;

const $ = selector => document.querySelector(selector);
const show = view => {
  document.querySelectorAll('.view').forEach(el => el.classList.toggle('active', el.id === view));
};
const setMessage = text => $('#message').textContent = text;
const setDigits = () => {
  $('#digits').textContent = (digits + '__').slice(0, 2);
  const ballot = digits.length === 2 ? classifyBallot(digits) : null;
  pending = ballot;
  $('#candidate').innerHTML = ballot?.candidate
    ? `<div class="candidate-card"><img src="assets/${ballot.candidate.image}" alt=""><div><h3>${ballot.candidate.name}</h3><p>Partido: ${ballot.candidate.party}</p><p>Número: ${ballot.candidate.number}</p></div></div>`
    : digits.length === 2 ? '<p>VOTO NULO</p>' : '<p>Digite o número do candidato</p>';
};
const reset = () => { digits = ''; pending = null; setDigits(); };
const recordsForMode = async () => {
  if (mode === 'session') return store.all();
  if (!api) throw new Error('A votação geral ainda não foi configurada.');
  return (await api.getAudit()).records;
};
const label = kind => ({ '13': '13 — Lula', '22': '22 — Bolsonaro', branco: 'Branco', nulo: 'Nulo' }[kind] || kind);
async function confirm() {
  const ballot = pending || (digits ? classifyBallot(digits) : null);
  if (!ballot) return setMessage('Digite um número ou escolha BRANCO.');
  const vote = { kind: ballot.kind, sessionId };
  setMessage('Registrando voto...');
  try {
    if (mode === 'session') store.add(vote); else {
      if (!api) throw new Error('Configure js/config.js para ativar a votação geral.');
      await api.registerVote(vote);
    }
    new Audio('./assets/Som de Urna Eletrônica.mp3').play().catch(() => {});
    setMessage('VOTO CONFIRMADO ✓');
    reset();
  } catch (error) { setMessage(error.message); }
}
async function audit() {
  $('#audit-message').textContent = 'Carregando...';
  try {
    const records = await recordsForMode();
    $('#audit-rows').innerHTML = records.map(v => `<tr><td>${new Date(v.recordedAt).toLocaleString('pt-BR')}</td><td>${mode === 'session' ? 'Sessão' : 'Geral'}</td><td>${label(v.kind)}</td></tr>`).join('') || '<tr><td colspan="3">Ainda não há votos.</td></tr>';
    $('#audit-message').textContent = `${records.length} voto(s) registrado(s).`;
  } catch (error) { $('#audit-message').textContent = error.message; }
}
async function result() {
  try {
    const votes = await recordsForMode();
    const shown = simulateResult(countBallots(votes));
    $('#result-content').innerHTML = `<div class="result-grid"><div class="result-card"><span>13 — Lula</span><strong>${shown['13']}</strong></div><div class="result-card"><span>22 — Bolsonaro</span><strong>${shown['22']}</strong></div><div class="result-card"><span>Branco</span><strong>${shown.branco}</strong></div><div class="result-card"><span>Nulo</span><strong>${shown.nulo}</strong></div></div><p><b>Total de votos: ${shown.total}</b></p><p>Resultado simulado para fins de brincadeira.</p>`;
    $('#result-dialog').showModal();
  } catch (error) { setMessage(error.message); }
}
document.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.view) return show(button.dataset.view);
  if (button.dataset.key && digits.length < 2) { digits += button.dataset.key; setDigits(); return; }
  if (button.dataset.mode) { mode = button.dataset.mode; document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('selected', b === button)); $('#mode-status').textContent = mode === 'session' ? 'Recomeça ao abrir/recarregar.' : api ? 'Compartilhada pela Planilha Google.' : 'Planilha geral ainda não configurada.'; reset(); return; }
  if (button.dataset.action === 'blank') { pending = classifyBallot('branco'); $('#digits').textContent = '__'; $('#candidate').innerHTML = '<p>VOTO EM BRANCO</p>'; return; }
  if (button.dataset.action === 'clear') return reset();
  if (button.dataset.action === 'confirm') return confirm();
  if (button.dataset.action === 'load-audit') return audit();
  if (button.dataset.action === 'close') return $('#result-dialog').close();
  if (button.id === 'result-button') return result();
});
document.addEventListener('keydown', event => {
  if (/^[0-9]$/.test(event.key)) document.querySelector(`[data-key="${event.key}"]`)?.click();
  if (event.key === 'Enter') confirm();
  if (event.key === 'Backspace') reset();
});
setDigits();
})();
