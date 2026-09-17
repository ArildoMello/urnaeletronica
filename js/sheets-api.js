export function createSheetsApi({ url, key, fetchImpl = fetch }) {
  if (!url || !key) return null;

  async function request(payload) {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ key, ...payload }),
    });
    const body = await response.json();
    if (!response.ok || !body.ok) {
      throw new Error(body.message || 'Não foi possível acessar a votação geral.');
    }
    return body;
  }

  return {
    registerVote(vote) {
      return request({ action: 'registrarVoto', vote });
    },
    getAudit() {
      return request({ action: 'consultarAuditoria' });
    },
  };
}
