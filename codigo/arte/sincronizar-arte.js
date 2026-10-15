// Arte provisória: copia ícones pintados do Guardiões e retratos do Baralho para codigo/imagens (até a arte própria chegar).
// Uso: node codigo/arte/sincronizar-arte.js
const fs = require('fs'), path = require('path');
const RAIZ = path.join(__dirname, '..', '..', '..'), DEST = path.join(__dirname, '..', 'imagens');
const ICONES = ['espada', 'espadas', 'escudo', 'machado', 'martelo', 'arco', 'frasco', 'comida', 'orbe', 'livro', 'bomba', 'pedra', 'cristal', 'coracao',
  'gota', 'chama', 'gelo', 'raio', 'serpente', 'moeda', 'ampulheta', 'estrela', 'folha', 'osso', 'medalha', 'trofeu', 'caveira', 'pergaminho', 'ferramenta',
  'olho', 'nevoa', 'sino', 'mao', 'brilho', 'xicara', 'vento', 'sol', 'lua', 'chave', 'coroa', 'sangue', 'pata', 'tridente', 'nota', 'alvo', 'etiqueta'];
let n = 0;
for(const i of ICONES){ const o = path.join(RAIZ, 'guardioes-da-fogueira-site', 'codigo', 'imagens', 'ic-' + i + '.webp'); if(fs.existsSync(o)){ fs.copyFileSync(o, path.join(DEST, 'ic-' + i + '.webp')); n++; } else console.log('sem', i); }
for(const c of ['guerreiro', 'mago', 'ladino']){ const o = path.join(RAIZ, 'baralho-das-cinzas', 'codigo', 'imagens', 'rosto-' + c + '-humano-m.webp'); if(fs.existsSync(o)){ fs.copyFileSync(o, path.join(DEST, 'rosto-' + c + '.webp')); n++; } }
console.log('ok ·', n, 'imagens');
