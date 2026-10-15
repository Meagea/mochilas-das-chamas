// Esteira de publicação: testa, gera o APK e o instalador de Windows, faz commit e push no GitHub
// e (com --release) cria a Release com os dois arquivos anexados.
// Uso: node codigo/esteira.js 2 "Mago jogável"                 (versão = número do artifact)
//      node codigo/esteira.js 2 "..." --release      também cria a Release v2 no GitHub com APK e .exe
//      node codigo/esteira.js 2 "..." --sem-validar  pula os testes (só se eles acabaram de passar)
// A publicação no claude.ai é feita à parte (pelo Claude, com o dist/ testado).
const { spawnSync } = require('child_process');
const fs = require('fs'), path = require('path');
const RAIZ = path.join(__dirname, '..');
const [versao, resumo] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flag = f => process.argv.includes(f);
if(!/^\d+$/.test(versao || '') || !resumo){ console.error('Uso: node codigo/esteira.js <versão> "<resumo>" [--release] [--sem-validar]'); process.exit(1); }
const passo = (nome, cmd, args, opts = {}) => {
  console.log(`\n▶ ${nome}`); const t0 = Date.now();
  const r = spawnSync(cmd, args, { cwd: RAIZ, stdio: 'inherit', ...opts });
  if(r.status !== 0){ console.error(`✘ ${nome} falhou (${((Date.now() - t0)/1000).toFixed(0)} s). A esteira parou aqui.`); process.exit(1); }
  console.log(`✔ ${nome} · ${((Date.now() - t0)/1000).toFixed(0)} s`);
};
const editar = (arq, re, novo) => { const p = path.join(RAIZ, arq); if(!fs.existsSync(p)) return; fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(re, novo)); };

// 1. montagem (também copia o jogo para os aplicativos) e testes
passo('montagem do jogo', process.execPath, [path.join(__dirname, 'build.js')]);
if(!flag('--sem-validar')) passo('testes (simulação e balanceamento)', process.execPath, [path.join(__dirname, 'testes', 'simulacao.js')]);

// 2. número da versão nos aplicativos (1.<versão>)
editar('3-app/android/app/build.gradle', /versionCode \d+/, `versionCode ${versao}`);
editar('3-app/android/app/build.gradle', /versionName "[^"]*"/, `versionName "1.${versao}"`);
editar('4-pc/package.json', /"version": "[^"]*"/, `"version": "1.${versao}.0"`);

// 3. APK (Android) com o JDK 21: o deste projeto (3-app/jdk) ou, se não houver, o do Guardiões
const apk = path.join(RAIZ, '3-app', 'Tralha-de-Guerra.apk');
if(fs.existsSync(path.join(RAIZ, '3-app', 'android'))){
  const jdk = [path.join(RAIZ, '3-app', 'jdk'), path.join(RAIZ, '..', 'guardioes-da-fogueira-site', '3-app', 'jdk')]
    .filter(d => fs.existsSync(d)).map(d => { const j = fs.readdirSync(d).find(n => n.startsWith('jdk-21')); return j && path.join(d, j); }).find(Boolean);
  if(!jdk){ console.error('✘ JDK 21 não encontrado (3-app/jdk ou o do Guardiões).'); process.exit(1); }
  const andr = path.join(RAIZ, '3-app', 'android'), gw = path.join(andr, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
  passo('APK Android', `"${gw}" assembleDebug --no-daemon -q`, [], { cwd: andr, shell: true, env: { ...process.env, JAVA_HOME: jdk } });
  fs.copyFileSync(path.join(RAIZ, '3-app/android/app/build/outputs/apk/debug/app-debug.apk'), apk);
}
// 4. instalador de Windows
let exe = null;
if(fs.existsSync(path.join(RAIZ, '4-pc', 'node_modules'))){
  passo('instalador de Windows', 'npm run dist', [], { cwd: path.join(RAIZ, '4-pc'), shell: true });
  exe = path.join(RAIZ, '4-pc', 'dist', fs.readdirSync(path.join(RAIZ, '4-pc', 'dist')).find(f => f.endsWith(`1.${versao}.0.exe`)) || '');
}
// 5. commit e push
const msg = `V${versao}: ${resumo}\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`;
passo('commit', 'git', ['add', '-A']);
const vazio = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: RAIZ }).status === 0;
if(!vazio) passo('commit', 'git', ['commit', '-q', '-F', '-'], { input: msg, stdio: ['pipe', 'inherit', 'inherit'] });
else console.log('  (nada novo para commitar)');
passo('push para o GitHub', 'git', ['push', 'origin', 'HEAD']);
// 6. Release com os arquivos (opcional)
if(flag('--release')){
  const gh = fs.existsSync('C:/Program Files/GitHub CLI/gh.exe') ? 'C:/Program Files/GitHub CLI/gh.exe' : 'gh';
  const anexos = [apk, exe].filter(f => f && fs.existsSync(f));
  passo('Release no GitHub', gh, ['release', 'create', `v${versao}`, ...anexos, '--title', `V${versao}`, '--notes', resumo]);
}
console.log(`\n✔ Esteira concluída: V${versao}${fs.existsSync(apk) ? ' · APK em 3-app/Tralha-de-Guerra.apk' : ''}${exe ? ' · instalador em 4-pc/dist' : ''}`);
