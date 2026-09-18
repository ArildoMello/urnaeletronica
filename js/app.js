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
  if (view === 'algorithm') startTerminal();
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
  if (!api) throw new Error('A planilha de votos não está configurada.');
  const records = (await api.getAudit()).records;
  return mode === 'session' ? records.filter(vote => vote.sessionId === sessionId) : records;
};
const label = kind => ({ '13': '13 — Lula', '22': '22 — Bolsonaro', branco: 'Branco', nulo: 'Nulo' }[kind] || kind);
async function confirm() {
  const ballot = pending || (digits ? classifyBallot(digits) : null);
  if (!ballot) return setMessage('Digite um número ou escolha BRANCO.');
  const vote = { kind: ballot.kind, sessionId, mode };
  setMessage('Registrando voto...');
  try {
    if (!api) throw new Error('A planilha de votos não está configurada.');
    await api.registerVote(vote);
    store.add(vote);
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
    if (!api) throw new Error('A planilha de votos não está configurada.');
    const allVotes = (await api.getAudit()).records;
    const sessionVotes = allVotes.filter(vote => vote.sessionId === sessionId);
    const panel = (title, votes) => { const shown = simulateResult(countBallots(votes)); return `<section class="result-panel"><h3>${title}</h3><div class="result-grid"><div class="result-card"><span>13 — Lula</span><strong>${shown['13']}</strong></div><div class="result-card"><span>22 — Bolsonaro</span><strong>${shown['22']}</strong></div><div class="result-card"><span>Branco</span><strong>${shown.branco}</strong></div><div class="result-card"><span>Nulo</span><strong>${shown.nulo}</strong></div></div><p><b>Total: ${shown.total}</b></p></section>`; };
    $('#result-content').innerHTML = `<style>.result-columns{display:grid;grid-template-columns:1fr 1fr;gap:20px}.result-panel{border:1px solid #d6dde3;border-radius:9px;padding:14px}.result-panel h3{margin-top:0;font-size:18px}@media(max-width:620px){.result-columns{grid-template-columns:1fr}}</style><div class="result-columns">${panel('Minha sessão online', sessionVotes)}${panel('Apuração geral no Google', allVotes)}</div><p>Resultado simulado para fins de brincadeira.</p>`;
    $('#result-dialog').showModal();
  } catch (error) { setMessage(error.message); }
}
document.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.view) return show(button.dataset.view);
  if (button.dataset.key && digits.length < 2) { digits += button.dataset.key; setDigits(); return; }
  if (button.dataset.mode) { mode = button.dataset.mode; document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('selected', b === button)); $('#mode-status').textContent = mode === 'session' ? 'Votos desta sessão também ficam na Planilha.' : 'Todos os votos ficam na Planilha Google.'; reset(); return; }
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
let terminalTimer;
function startTerminal() {
  if (terminalTimer) return;
  const terminal = document.querySelector('.terminal');
  terminal.innerHTML = '<div id="code-stream"></div><span class="cursor">_</span>';
  const stream = document.querySelector('#code-stream');
  const snippets = [
    ['C#', 'if (resultado == resultado) { Console.WriteLine("normal?"); }'],
    ['Python', 'while votos < votos: votos += banana'],
    ['Java', 'public static void corrigirTudo() { /* ops */ }'],
    ['Ruby', 'resultado.reverse! if resultado.ficou_serio?'],
    ['PHP', '$urna = $urna ?? "foi sem querer";'],
    ['C', 'char* recado = "ops. Chandão, não deixa isso...";'],
    ['BUG', 'ERRO 0xBANANA: apaga isso, esquece o que eu... ops.'],
    ['OK', 'a agora sim! modo_trote = true;']
  ];
  let line = 0, char = 0, deleting = false, wait = 0;
  terminalTimer = setInterval(() => {
    const [language, code] = snippets[line];
    if (wait > 0) { wait -= 1; return; }
    const text = code.slice(0, char);
    stream.innerHTML = `<p class="code-line ${language === 'BUG' ? 'glitch' : language === 'OK' ? 'comic' : ''}">[${language}] ${text}</p>` + stream.innerHTML.split('</p>').slice(0, 8).join('</p>');
    if (!deleting && char < code.length) char += 1;
    else if (!deleting) { wait = 14; deleting = true; }
    else if (char > 0) char -= 2;
    else { deleting = false; line = (line + 1) % snippets.length; wait = 4; }
  }, 35);
}
setDigits();
})();
