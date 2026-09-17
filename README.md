# Urna Web

Versão para navegador da brincadeira de urna. É uma simulação humorística e educacional, não um sistema eleitoral.

## Uso rápido

Abra `index.html` em um servidor estático ou publique esta pasta no GitHub Pages. A modalidade **Minha sessão** funciona sem configuração e zera ao recarregar a página.

## Votação geral com Planilha Google

1. Crie uma Planilha Google e deixe o nome da aba como `Votos`.
2. Copie `google-apps-script/Code.gs` para um novo projeto em [Google Apps Script](https://script.google.com).
3. Nas propriedades do script, crie `SHEET_ID` (o ID da sua planilha) e `VOTE_ACCESS_KEY` (uma frase de sua escolha).
4. Implante como **Aplicativo da Web**, executando como sua conta e permitindo acesso a quem usar o link.
5. Copie `js/config.example.js` como `js/config.js`, cole a URL da implantação e a mesma chave.
6. Não envie `js/config.js` ao GitHub; a chave é uma proteção casual, não segurança forte.
7. Publique a pasta no GitHub Pages.

## Checklist de publicação

- A planilha possui a aba `Votos` com os cabeçalhos `Data`, `Modalidade`, `Voto`, `Sessão`.
- As propriedades `SHEET_ID` e `VOTE_ACCESS_KEY` estão configuradas.
- A URL do Apps Script está em `js/config.js`.
- O GitHub Pages publica o diretório deste projeto.

## Testes

Com Node.js disponível:

```powershell
node --test tests/*.test.js
```

Os testes cobrem a classificação de votos, a regra de apuração, a preservação dos totais, o envio geral e a sessão temporária.

