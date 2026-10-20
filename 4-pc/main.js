// Bornal de Guerra para Windows: abre o jogo (index.html, copiado pelo codigo/build.js) numa janela própria.
// A janela lembra tamanho, posição, maximizada e tela cheia; F11 alterna a tela cheia; sem menu e sem zoom acidental.
const { app, BrowserWindow, Menu, shell, screen } = require('electron');
const path = require('path'), fs = require('fs');
// o mesmo appId do instalador: a barra de tarefas agrupa e mostra o nome certo do jogo
app.setAppUserModelId('com.penaepincel.bornaldeguerra');
// sem o menu padrão do Electron: some também os atalhos dele (Ctrl+R recarrega, Ctrl + e Ctrl - dão zoom)
Menu.setApplicationMenu(null);

const ARQ_JANELA = () => path.join(app.getPath('userData'), 'janela.json');
function lerJanela(){
  try{
    const j = JSON.parse(fs.readFileSync(ARQ_JANELA(), 'utf8'));
    // só volta para a posição guardada se ela ainda cabe em algum monitor (o monitor pode ter sido desligado)
    const cabe = screen.getAllDisplays().some(d => { const a = d.workArea; return j.x >= a.x - 50 && j.y >= a.y - 50 && j.x < a.x + a.width - 100 && j.y < a.y + a.height - 100; });
    return cabe ? j : {width:j.width, height:j.height, maximizada:j.maximizada, cheia:j.cheia};
  }catch(e){ return {}; }
}
function guardarJanela(win){
  try{
    const b = win.getNormalBounds();
    fs.writeFileSync(ARQ_JANELA(), JSON.stringify({x:b.x, y:b.y, width:b.width, height:b.height, maximizada:win.isMaximized(), cheia:win.isFullScreen()}));
  }catch(e){}
}

app.whenReady().then(() => {
  const j = lerJanela();
  const win = new BrowserWindow({
    x:j.x, y:j.y, width:j.width || 1400, height:j.height || 860, minWidth:900, minHeight:600,
    title:'Bornal de Guerra', autoHideMenuBar:true, backgroundColor:'#121117', show:false,
    // em segundo plano o jogo desacelera (economiza processador e bateria)
    webPreferences:{ backgroundThrottling:true },
  });
  if(j.maximizada) win.maximize();
  if(j.cheia) win.setFullScreen(true);
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, 'index.html'));
  // links externos abrem no navegador, não dentro do jogo
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  // F11 alterna a tela cheia; Ctrl + roda do mouse e Ctrl +/- não dão zoom
  win.webContents.on('before-input-event', (e, input) => {
    if(input.type !== 'keyDown') return;
    if(input.key === 'F11'){ win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    else if(input.control && ['+', '-', '=', '0'].includes(input.key)) e.preventDefault();
  });
  win.webContents.on('did-finish-load', () => { win.webContents.setZoomFactor(1); win.webContents.setVisualZoomLevelLimits(1, 1); });
  win.webContents.on('zoom-changed', () => win.webContents.setZoomFactor(1));
  // guarda o tamanho e a posição ao mexer e ao fechar
  let t = null; const depois = () => { clearTimeout(t); t = setTimeout(() => guardarJanela(win), 400); };
  for(const ev of ['resize', 'move', 'maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen']) win.on(ev, depois);
  win.on('close', () => guardarJanela(win));
});
app.on('window-all-closed', () => app.quit());
