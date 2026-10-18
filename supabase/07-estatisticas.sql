-- Tralha de Guerra · estatísticas dos personagens: vitórias reais de cada classe, para acompanhar o equilíbrio
-- Rodar no SQL Editor depois do 06-ranked.sql. Pode rodar de novo sem estragar nada.
-- (este arquivo substitui aplicar_rank, que o 06 também define: se rodar o 06 de novo, rode este logo depois.)
--
-- Como funciona:
--  * cada corrida fechada (fechar_corrida → aplicar_rank) soma uma linha agregada por dia, classe, modo e faixa de nível
--    do personagem (1: níveis 1 a 3, 2: níveis 4 a 6, 3: níveis 7 a 10). Não guarda quem jogou: só os totais;
--  * as corridas em si continuam sendo apagadas depois de 7 dias (03-experiencia.sql); os totais ficam;
--  * jogadores bloqueados (05-nomes.sql) e corridas sem nenhuma rodada não contam;
--  * estatisticas_classes(dias) é pública e devolve os totais dos últimos dias (padrão 30).

create table if not exists public.estatisticas_classe (
  dia date not null default current_date,
  classe text not null check (classe ~ '^[a-z]{2,20}$'),
  modo text not null,
  faixa smallint not null check (faixa between 1 and 3),
  corridas integer not null default 0,
  rodadas integer not null default 0,
  vitorias integer not null default 0,
  sete integer not null default 0,
  primary key (dia, classe, modo, faixa)
);
alter table public.estatisticas_classe enable row level security;
revoke all on public.estatisticas_classe from anon, authenticated;

-- o nível do personagem pela experiência (a mesma curva de NIVEIS_XP em codigo/scripts/01-itens.js)
create or replace function public.nivel_xp(p_xp int) returns smallint
language sql immutable as $$
  select (1 + (select count(*) from unnest(array[40, 120, 250, 450, 750, 1150, 1700, 2400, 3300]) as l(v) where coalesce(p_xp, 0) >= l.v))::smallint
$$;

-- igual ao do 06-ranked.sql, com a soma das estatísticas no começo (vale para toda corrida fechada, ranqueada ou normal)
create or replace function public.aplicar_rank(p_corrida bigint, p_vitorias int, out antes integer, out depois integer)
language plpgsql security definer set search_path = public as $$
declare c corridas; r ranking; entrada int; delta int; nv smallint; v int;
begin
  select * into c from corridas where id = p_corrida;
  if c.id is null then return; end if;
  if c.rodadas > 0 and not exists (select 1 from jogadores where id = c.jogador_id and bloqueado) then
    select nivel_xp(xp) into nv from experiencia where jogador_id = c.jogador_id and classe = c.classe;
    nv := coalesce(nv, 1); v := greatest(0, least(coalesce(p_vitorias, 0), c.rodadas));
    insert into estatisticas_classe (dia, classe, modo, faixa, corridas, rodadas, vitorias, sete)
    values (current_date, c.classe, case when c.modo = 'ranqueada' then 'ranqueada' else 'normal' end,
            case when nv <= 3 then 1 when nv <= 6 then 2 else 3 end, 1, c.rodadas, v, case when v >= 7 then 1 else 0 end)
    on conflict (dia, classe, modo, faixa) do update set corridas = estatisticas_classe.corridas + 1,
      rodadas = estatisticas_classe.rodadas + excluded.rodadas, vitorias = estatisticas_classe.vitorias + excluded.vitorias,
      sete = estatisticas_classe.sete + excluded.sete;
  end if;
  if c.modo <> 'ranqueada' or c.rodadas = 0 or temporada_atual() is null then return; end if;
  if exists (select 1 from jogadores where id = c.jogador_id and bloqueado) then return; end if;
  r := linha_ranking(c.jogador_id);
  entrada := (array[0, 20, 30, 40, 50, 60, 70])[liga_de(r.pontos) + 1];
  delta := 12 * p_vitorias + case when p_vitorias >= 7 then 20 else 0 end - entrada;
  antes := r.pontos; depois := greatest(0, r.pontos + delta);
  update ranking set pontos = depois, melhor_pontos = greatest(melhor_pontos, depois), corridas = corridas + 1,
    melhor_campanha = greatest(melhor_campanha, p_vitorias), atualizado_em = now()
  where temporada = r.temporada and jogador_id = c.jogador_id;
end $$;

-- os totais dos últimos p_dias dias (1 a 365), por classe, modo e faixa de nível
create or replace function public.estatisticas_classes(p_dias int default 30)
returns table (classe text, modo text, faixa smallint, corridas bigint, rodadas bigint, vitorias bigint, sete bigint)
language sql stable security definer set search_path = public as $$
  select e.classe, e.modo, e.faixa, sum(e.corridas), sum(e.rodadas), sum(e.vitorias), sum(e.sete)
  from estatisticas_classe e
  where e.dia > current_date - least(greatest(coalesce(p_dias, 30), 1), 365)
  group by e.classe, e.modo, e.faixa
$$;

revoke all on function public.aplicar_rank(bigint, integer), public.nivel_xp(int) from public, anon, authenticated;
revoke all on function public.estatisticas_classes(int) from public;
grant execute on function public.estatisticas_classes(int) to anon, authenticated;
