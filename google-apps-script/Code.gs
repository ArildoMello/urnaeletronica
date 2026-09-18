function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents || '{}');
    validateKey_(payload.key);
    const sheet = getSheet_();

    if (payload.action === 'registrarVoto') {
      const vote = payload.vote || {};
      if (!['13', '22', 'branco', 'nulo'].includes(vote.kind)) {
        throw new Error('Tipo de voto inválido.');
      }
      sheet.appendRow([new Date(), vote.mode === 'session' ? 'sessão' : 'geral', vote.kind, String(vote.sessionId || '')]);
      return json_({ ok: true });
    }

    if (payload.action === 'consultarAuditoria') {
      const rows = sheet.getDataRange().getValues().slice(1).map(row => ({
        recordedAt: row[0] instanceof Date ? row[0].toISOString() : String(row[0]),
        mode: row[1], kind: row[2], sessionId: row[3],
      }));
      return json_({ ok: true, records: rows });
    }

    throw new Error('Ação inválida.');
  } catch (error) {
    return json_({ ok: false, message: error.message || 'Erro inesperado.' });
  }
}

function getSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('SHEET_ID não foi configurado.');
  const spreadsheet = SpreadsheetApp.openById(id);
  const sheet = spreadsheet.getSheetByName('Votos') || spreadsheet.insertSheet('Votos');
  if (sheet.getLastRow() === 0) sheet.appendRow(['Data', 'Modalidade', 'Voto', 'Sessão']);
  return sheet;
}

function validateKey_(key) {
  const expected = PropertiesService.getScriptProperties().getProperty('VOTE_ACCESS_KEY');
  if (!expected || key !== expected) throw new Error('Chave inválida.');
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
