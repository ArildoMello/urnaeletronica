export const CANDIDATES = {
  '13': { number: '13', name: 'Luiz Inácio Lula da Silva', party: 'PT', image: 'lula.jpg' },
  '22': { number: '22', name: 'Jair Messias Bolsonaro', party: 'PL', image: 'bolso.jpg' },
};

export function classifyBallot(code) {
  const value = String(code).trim();
  if (value === 'branco') return { kind: 'branco', candidate: null };
  if (CANDIDATES[value]) return { kind: value, candidate: CANDIDATES[value] };
  return { kind: 'nulo', candidate: null };
}

export function countBallots(ballots) {
  const counts = { '13': 0, '22': 0, branco: 0, nulo: 0, total: 0 };
  for (const ballot of ballots) {
    const kind = typeof ballot === 'string' ? classifyBallot(ballot).kind : ballot.kind;
    counts[kind] += 1;
    counts.total += 1;
  }
  return counts;
}

export function simulateResult(counts) {
  const candidate13 = counts['13'];
  const candidate22 = counts['22'];
  const valid = candidate13 + candidate22;
  const shown13 = valid === 0 ? 0 : candidate13 > candidate22 ? candidate13 : candidate13 === candidate22 ? candidate13 + 1 : candidate22;
  const shown22 = valid === 0 ? 0 : candidate13 > candidate22 ? candidate22 : candidate13 === candidate22 ? candidate22 - 1 : candidate13;
  return {
    '13': shown13,
    '22': shown22,
    branco: counts.branco,
    nulo: counts.nulo,
    total: shown13 + shown22 + counts.branco + counts.nulo,
  };
}
