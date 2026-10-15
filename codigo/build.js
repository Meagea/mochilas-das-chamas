// Tralha de Guerra · montagem
// Junta as partes de codigo/ num jogo de arquivo único:
//   dist/tralha.html        → versão para publicar (fragmento: o artifact põe o <html> em volta)
//   ../teste/tralha.html    → documento completo para abrir direto no navegador
// Uso: node codigo/build.js   (Node 16 ou mais novo, sem dependências)
const fs = require('fs'), path = require('path');
const DIR = __dirname, ROOT = path.join(DIR, '..');
const ler = p => fs.readFileSync(path.join(DIR, p), 'utf8');
const lista = pasta => fs.readdirSync(path.join(DIR, pasta)).filter(f => /\.(css|js)$/.test(f)).sort();
const gravar = (p, c) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, c); };

// 1. partes, na ordem do número do arquivo; cada script precisa estar completo sozinho, e juntos também
const css = lista('estilos').map(f => ler('estilos/' + f)).join('');
for (const f of lista('scripts')) {
  try { new Function(ler('scripts/' + f)); }
  catch (e) { console.error(`Erro de sintaxe em scripts/${f}: ${e.message}`); process.exit(1); }
}
const js = lista('scripts').map(f => ler('scripts/' + f)).join('');
try { new Function(js); } catch (e) { console.error(`Erro ao juntar os scripts: ${e.message}`); process.exit(1); }

// 2. arte: as imagens de codigo/imagens entram embutidas em '__ARTE__'
const IMG = path.join(DIR, 'imagens'), arte = {};
for (const f of fs.readdirSync(IMG).filter(f => /\.(png|webp|jpg)$/.test(f)).sort()) {
  const tipo = f.endsWith('.png') ? 'image/png' : f.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  arte[f.replace(/\.\w+$/, '')] = `data:${tipo};base64,${fs.readFileSync(path.join(IMG, f)).toString('base64')}`;
}
const jogo = `(() => {\n'use strict';\n${js.replace("'__ARTE__'", JSON.stringify(arte))}})();\n`;

// 3. saídas
const cabecalho = ler('pagina/cabecalho.html'), corpo = ler('pagina/corpo.html');
const fragmento = `${cabecalho}<style>\n${css}</style>\n${corpo}<script>\n${jogo}</script>\n`;
gravar(path.join(DIR, 'dist/tralha.html'), fragmento);
const cut = fragmento.indexOf('</style>') + '</style>'.length;
gravar(path.join(ROOT, 'teste/tralha.html'),
  `<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n${fragmento.slice(0, cut)}\n</head>\n<body>\n${fragmento.slice(cut)}</body>\n</html>\n`);
// 4. aplicativos (3-app: APK, 4-pc: Windows): se os projetos existirem, recebem o jogo novo
{ const teste = path.join(ROOT, 'teste/tralha.html');
  for(const destino of ['3-app/www/index.html', '3-app/android/app/src/main/assets/public/index.html', '4-pc/index.html'])
    if(fs.existsSync(path.dirname(path.join(ROOT, destino)))) fs.copyFileSync(teste, path.join(ROOT, destino)); }
console.log(`ok · ${lista('estilos').length} estilos, ${lista('scripts').length} scripts, ${Object.keys(arte).length} imagens · ${(fragmento.length / 1024) | 0} KB`);
