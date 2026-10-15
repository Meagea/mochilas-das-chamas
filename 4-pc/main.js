// Tralha de Guerra para Windows: abre o jogo (index.html, copiado pelo codigo/build.js) numa janela própria.
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1400, height: 860, minWidth: 900, minHeight: 600,
    title: 'Tralha de Guerra', autoHideMenuBar: true, backgroundColor: '#121117',
  });
  win.loadFile(path.join(__dirname, 'index.html'));
  // links externos abrem no navegador, não dentro do jogo
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  // F11 alterna a tela cheia
  win.webContents.on('before-input-event', (e, input) => { if(input.type === 'keyDown' && input.key === 'F11'){ win.setFullScreen(!win.isFullScreen()); e.preventDefault(); } });
});
app.on('window-all-closed', () => app.quit());
