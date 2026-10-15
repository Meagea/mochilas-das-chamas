// Carrega o jogo montado (dist/) no Node, sem navegador, e devolve as funções pedidas.
// Uso: const t = require('./carregar')('C, novaCorrida, lutar');  →  t.C é sempre o estado atual
const fs = require('fs'), path = require('path');
const ARQUIVO = path.join(__dirname, '..', 'dist', 'tralha.html');
module.exports = function carregar(nomes) {
  if (!fs.existsSync(ARQUIVO)) throw new Error('Rode primeiro: node codigo/build.js');
  const html = fs.readFileSync(ARQUIVO, 'utf8');
  let js = html.slice(html.lastIndexOf('<script>\n') + 9, html.lastIndexOf('</script>'));
  const fim = js.lastIndexOf('})();');
  const exp = nomes.split(',').map(s => s.trim()).filter(Boolean).map(n => `get ${n}(){ return ${n}; }`).join(', ');
  js = js.slice(0, fim) + `globalThis.__t = {${exp}};\n` + js.slice(fim);
  new Function(js)();
  const t = globalThis.__t; delete globalThis.__t;
  return t;
};
