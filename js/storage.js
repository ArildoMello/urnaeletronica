export function createSessionStore() {
  const votes = [];
  return {
    add(vote) { votes.push({ ...vote, recordedAt: new Date().toISOString() }); },
    all() { return votes.map(vote => ({ ...vote })); },
    clear() { votes.length = 0; },
  };
}

