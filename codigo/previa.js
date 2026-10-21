// Servidor local para testar no navegador: node codigo/previa.js  →  http://localhost:8770
// Lê o arquivo a cada pedido: depois de "node codigo/build.js", basta recarregar a página.
// Com ?t na URL, a página ganha window.__t.ev(código) para os testes olharem o jogo por dentro.
const http = require('http'), fs = require('fs'), path = require('path');
const ARQ = path.join(__dirname, '..', 'teste', 'bornal.html');
http.createServer((q, r) => {
  if(q.url.split('?')[0] !== '/'){ r.writeHead(404); return r.end(); }
  let s = fs.readFileSync(ARQ, 'utf8');
  if(/[?&]t(&|$)/.test(q.url)){ const i = s.lastIndexOf('})();'); if(i > 0) s = s.slice(0, i) + 'window.__t={ev:s=>eval(s)};' + s.slice(i); }
  r.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store'}); r.end(s);
}).listen(8770, () => console.log('http://localhost:8770'));
