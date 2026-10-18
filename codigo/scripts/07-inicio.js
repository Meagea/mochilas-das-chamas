// ---------- Início: tela de carregamento, depois o lobby, e sincroniza com o servidor ----------
if(uiAtiva){
  // a tela de carregamento prepara as imagens e já confirma que o servidor responde (06b-carregando.js)
  carregarJogo().catch(() => { const c = $('carregando'); if(c) c.remove(); desenhar(); }).then(() => { if(PERFIL.nome && !nomePermitido(PERFIL.nome)){ PERFIL.nome = ''; gravarPerfil(); if(tela === 'lobby') desenhar(); } if(PERFIL.nome && PERFIL.nome.length >= 2) onlineNome(PERFIL.nome);
    Promise.all([sincronizarExperiencia(), sincronizarColecao()]).then(([ok]) => { if(ok && (tela === 'lobby' || tela === 'trilha')) desenhar(); }); });
  let largAnt = window.innerWidth;
  window.addEventListener('resize', () => { if(Math.abs(window.innerWidth - largAnt) > 30 && tela === 'loja' && !arr){ largAnt = window.innerWidth; desenhar(); } });
}
