// ---------- Início: desenha o lobby e testa a conexão com o servidor ----------
if(uiAtiva){
  desenhar();
  // um pedido de verdade: entra (se preciso) e confirma que o servidor responde
  onlineAmostra(1).then(() => { if(tela === 'lobby') desenhar(); if(PERFIL.nome && PERFIL.nome.length >= 2) onlineNome(PERFIL.nome);
    Promise.all([sincronizarExperiencia(), sincronizarColecao()]).then(([ok]) => { if(ok && (tela === 'lobby' || tela === 'trilha')) desenhar(); }); });
  let largAnt = window.innerWidth;
  window.addEventListener('resize', () => { if(Math.abs(window.innerWidth - largAnt) > 30 && tela === 'loja' && !arr){ largAnt = window.innerWidth; desenhar(); } });
}
