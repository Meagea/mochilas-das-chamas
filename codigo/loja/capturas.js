// Gera as imagens da Google Play em loja/: capturas de celular (1080 × 1920) e o gráfico de destaque (1024 × 500).
// Usa o Chrome (ou o Edge) em modo invisível. Uso, depois de node codigo/build.js:  node codigo/loja/capturas.js
// Cada cena é o jogo de teste com um trecho que arruma a tela (dentro do jogo, depois da tela de carregamento).
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const RAIZ = path.join(__dirname, '..', '..'), SAIDA = path.join(RAIZ, 'loja'), TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tralha-loja-'));
const NAVEGADOR = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(f => fs.existsSync(f));
if(!NAVEGADOR){ console.error('Chrome ou Edge não encontrado.'); process.exit(1); }
const JOGO = fs.readFileSync(path.join(RAIZ, 'teste', 'tralha.html'), 'utf8');

const PERFIL = "PERFIL.nome = 'Pena'; PERFIL.xp = {guerreiro:820, mago:300, ladino:130, ferreiro:2500, herbalista:60, cozinheiro:500, alquimista:900, coureiro:40, joalheiro:1300, inventor:200, cervejeiro:90};";
const CENAS = {
  'tela-1.png': `${PERFIL} classeEscolhida = 'ferreiro'; tela = 'lobby'; desenhar();`,
  'tela-2.png': `${PERFIL} novaCorrida('guerreiro', 77, 10); C.mochila = montarRobo('guerreiro', 7, 44, 10); for(let i = 0; i < 3; i++) oficio(C.mochila, i); C.rodada = 7; C.vitorias = 4; C.derrotas = 1; C.ouro = 21; C.loja = ['espadaLonga', 'escudoTorre', 'pocaoCura', 'machadoFuria', 'estandarte']; tela = 'loja'; desenhar();`,
  'tela-3.png': `${PERFIL} novaCorrida('ferreiro', 91, 10); C.mochila = montarRobo('ferreiro', 7, 51, 10); for(let i = 0; i < 4; i++) oficio(C.mochila, i); C.rodada = 7; C.vitorias = 5; tela = 'loja'; desenhar(); setTimeout(() => $('btLutar').click(), 300);`,
  'tela-4.png': `${PERFIL} novaCorrida('alquimista', 33, 10); C.mochila = montarRobo('alquimista', 8, 72, 10); for(let i = 0; i < 4; i++) oficio(C.mochila, i); C.rodada = 8; C.vitorias = 6; tela = 'loja'; desenhar(); setTimeout(() => $('btLutar').click(), 300); setTimeout(() => { lutaAtual.tempo = 1e9; }, 2500); setTimeout(() => { const b = $('btStats'); if(b) b.click(); }, 4000);`,
  'tela-5.png': `${PERFIL} classeEscolhida = 'joalheiro'; tela = 'trilha'; desenhar(); setTimeout(() => document.querySelectorAll('.trilha li')[4].scrollIntoView(), 200);`,
  'tela-6.png': `${PERFIL} novaCorrida('cozinheiro', 12, 10); C.mochila = montarRobo('cozinheiro', 8, 63, 10); for(let i = 0; i < 4; i++) oficio(C.mochila, i); C.rodada = 8; C.vitorias = 5; C.ouro = 14; C.loja = ['bolo', 'pao', 'espeto', 'temperos', 'queijo']; tela = 'loja'; desenhar();`,
};
function tirar(arqHtml, saida, w, h, escala, tempo){
  const r = spawnSync(NAVEGADOR, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', `--user-data-dir=${path.join(TMP, 'perfil')}`,
    `--window-size=${w},${h}`, `--force-device-scale-factor=${escala}`, `--virtual-time-budget=${tempo}`, `--screenshot=${saida}`, 'file:///' + arqHtml.replace(/\\/g, '/')], { encoding:'utf8', timeout:120000 });
  console.log(fs.existsSync(saida) ? 'ok ' + path.basename(saida) : 'FALHOU ' + path.basename(saida) + ' ' + (r.stderr || '').slice(-300));
}
fs.mkdirSync(SAIDA, { recursive:true });
for(const [nome, cena] of Object.entries(CENAS)){
  const i = JOGO.lastIndexOf('})();');
  // espera a tela de carregamento sair (uns 2,5 s) e arruma a cena; o tempo de luta corre no relógio virtual do navegador
  const html = JOGO.slice(0, i) + `setTimeout(() => { try{ ${cena} }catch(e){ document.title = 'erro: ' + e.message; } }, 3500);\n` + JOGO.slice(i);
  const arq = path.join(TMP, nome + '.html'); fs.writeFileSync(arq, html);
  tirar(arq, path.join(SAIDA, nome), 540, 960, 2, nome === 'tela-3.png' ? 9000 : nome === 'tela-4.png' ? 9500 : 6000);
}
// gráfico de destaque: arena, três personagens e o nome
const img = n => 'file:///' + path.join(RAIZ, 'codigo', 'imagens', n).replace(/\\/g, '/');
const banner = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&display=swap"><style>
  body{ margin:0; width:1024px; height:500px; overflow:hidden; background:#121117 url('${img('fundo-luta.webp')}') center / cover; font-family:'Barlow Condensed', 'Arial Narrow', sans-serif; color:#f6efe4; }
  .vel{ position:absolute; inset:0; background:linear-gradient(90deg, rgba(18,17,23,.92) 0%, rgba(18,17,23,.7) 45%, rgba(18,17,23,.15) 100%); }
  .txt{ position:absolute; left:56px; top:92px; width:470px; } small{ letter-spacing:.32em; color:#f2b350; font-weight:700; font-size:22px; text-transform:uppercase; }
  h1{ margin:6px 0 10px; font-size:96px; line-height:.9; text-transform:uppercase; text-shadow:0 6px 30px rgba(0,0,0,.7); } p{ margin:0; font-size:30px; color:#e6d6bd; font-weight:700; }
  .rostos{ position:absolute; right:34px; bottom:40px; display:flex; gap:16px; }
  .rostos img{ width:150px; height:150px; border-radius:24px; object-fit:cover; object-position:50% 20%; border:4px solid #f2b350; box-shadow:0 14px 40px rgba(0,0,0,.6); }
  .rostos img:nth-child(2){ transform:translateY(-70px); }
</style></head><body><div class="vel"></div><div class="txt"><small>batalha de mochilas</small><h1>Tralha de Guerra</h1><p>Monte a mochila. Vença a luta.</p></div>
<div class="rostos"><img src="${img('retrato-mago.webp')}"><img src="${img('retrato-guerreiro.webp')}"><img src="${img('retrato-cozinheiro.webp')}"></div></body></html>`;
const arqB = path.join(TMP, 'banner.html'); fs.writeFileSync(arqB, banner);
tirar(arqB, path.join(SAIDA, 'destaque-1024x500.png'), 1024, 500, 1, 4000);
