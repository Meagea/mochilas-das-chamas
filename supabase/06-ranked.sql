-- Bornal de Guerra · ranked com ligas (Bronze, Prata, Ouro, Platina, Diamante com divisões III/II/I; Mestre; Grão-Mestre)
-- Rodar no SQL Editor depois do 05-nomes.sql. Pode rodar de novo sem estragar nada.
-- (o 04-cartas.sql chama aplicar_rank no fim da corrida; se rodar o 04 de novo, nada se perde. Se rodar o esquema.sql ou
--  o 05-nomes.sql de novo, rode este logo depois: ele substitui registrar_luta, ranking_temporada e sortear_adversario.)
--
-- Como funciona:
--  * a corrida começa com o modo (iniciar_corrida(classe, 'ranqueada')); só a ranqueada mexe nos pontos de liga;
--  * no fim da corrida: pontos = 12 por vitória + 20 ao fechar 7 vitórias, menos a "entrada" da liga
--    (Bronze 0, Prata 20, Ouro 30, Platina 40, Diamante 50, Mestre 60, Grão-Mestre 70). Quem para cedo nas ligas altas perde pontos;
--  * nunca fica abaixo de 0. Cada liga tem 400 pontos (Bronze 0–399 ... Diamante 1600–1999), com 3 divisões de ~133;
--    Mestre de 2000 a 2399 e Grão-Mestre de 2400 para cima;
--  * a luta online não dá mais pontos sozinha (registrar_luta só conta vitórias e derrotas);
--  * as mochilas guardam a liga de quem as montou, e o sorteio da ranqueada prefere adversários da mesma liga;
--  * temporada nova: cada jogador começa com metade dos pontos da temporada anterior.

alter table public.corridas add column if not exists modo text not null default '';
alter table public.ranking add column if not exists melhor_pontos integer not null default 0;
alter table public.ranking add column if not exists corridas integer not null default 0;
alter table public.mochilas add column if not exists liga smallint not null default 0;

-- 0 Bronze, 1 Prata, 2 Ouro, 3 Platina, 4 Diamante, 5 Mestre, 6 Grão-Mestre
create or replace function public.liga_de(p_pontos int) returns smallint
language sql immutable as $$ select least(greatest(coalesce(p_pontos, 0), 0) / 400, 6)::smallint $$;

-- a linha do jogador na temporada atual; na primeira vez, começa com metade dos pontos da temporada anterior
create or replace function public.linha_ranking(p_jogador uuid) returns ranking
language plpgsql security definer set search_path = public as $$
declare t smallint := temporada_atual(); r ranking; antes int;
begin
  select * into r from ranking where temporada = t and jogador_id = p_jogador;
  if r.jogador_id is null then
    select pontos into antes from ranking where jogador_id = p_jogador and temporada < t order by temporada desc limit 1;
    insert into jogadores (id) values (p_jogador) on conflict (id) do nothing;
    insert into ranking (temporada, jogador_id, pontos) values (t, p_jogador, greatest(0, coalesce(antes, 0) / 2))
    on conflict do nothing;
    select * into r from ranking where temporada = t and jogador_id = p_jogador;
  end if;
  return r;
end $$;

-- começa a corrida dizendo o modo
create or replace function public.iniciar_corrida(p_classe text, p_modo text) returns bigint
language plpgsql security definer set search_path = public as $$
declare novo bigint;
begin
  novo := iniciar_corrida(p_classe);
  update corridas set modo = case when p_modo in ('ranqueada', 'normal') then p_modo else '' end where id = novo;
  return novo;
end $$;

-- chamado pelo fechar_corrida (04-cartas.sql): soma os pontos de liga de uma corrida ranqueada; devolve antes e depois
create or replace function public.aplicar_rank(p_corrida bigint, p_vitorias int, out antes integer, out depois integer)
language plpgsql security definer set search_path = public as $$
declare c corridas; r ranking; entrada int; delta int;
begin
  select * into c from corridas where id = p_corrida;
  if c.id is null or c.modo <> 'ranqueada' or c.rodadas = 0 or temporada_atual() is null then return; end if;
  if exists (select 1 from jogadores where id = c.jogador_id and bloqueado) then return; end if;
  r := linha_ranking(c.jogador_id);
  entrada := (array[0, 20, 30, 40, 50, 60, 70])[liga_de(r.pontos) + 1];
  delta := 12 * p_vitorias + case when p_vitorias >= 7 then 20 else 0 end - entrada;
  antes := r.pontos; depois := greatest(0, r.pontos + delta);
  update ranking set pontos = depois, melhor_pontos = greatest(melhor_pontos, depois), corridas = corridas + 1,
    melhor_campanha = greatest(melhor_campanha, p_vitorias), atualizado_em = now()
  where temporada = r.temporada and jogador_id = c.jogador_id;
end $$;

-- a luta online só conta vitórias e derrotas (os pontos vêm da corrida inteira)
create or replace function public.registrar_luta(p_venceu boolean, p_campanha int) returns integer
language plpgsql security definer set search_path = public as $$
declare r ranking;
begin
  if auth.uid() is null then raise exception 'sem login'; end if;
  if temporada_atual() is null or esta_bloqueado() then return 0; end if;
  r := linha_ranking(auth.uid());
  if r.dia <> current_date then r.lutas_hoje := 0; end if;
  if r.lutas_hoje >= 60 then return r.pontos; end if;
  update ranking set vitorias = vitorias + case when p_venceu then 1 else 0 end, derrotas = derrotas + case when p_venceu then 0 else 1 end,
    lutas_hoje = r.lutas_hoje + 1, dia = current_date, atualizado_em = now()
  where temporada = r.temporada and jogador_id = auth.uid();
  return r.pontos;
end $$;

-- a mochila guarda a liga de quem a montou (para o sorteio)
create or replace function public.mochila_com_liga() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.liga := liga_de(coalesce((select pontos from ranking where jogador_id = new.jogador_id and temporada = temporada_atual()), 0));
  return new;
end $$;
drop trigger if exists mochila_liga on public.mochilas;
create trigger mochila_liga before insert on public.mochilas for each row execute function public.mochila_com_liga();

-- sorteio da ranqueada: mesma liga primeiro, depois campanha parecida
create or replace function public.sortear_adversario(p_rodada int, p_versao int, p_vitorias int)
returns table (id bigint, nome text, classe text, itens jsonb, vitorias smallint, vidas smallint)
language sql security definer set search_path = public as $$
  select m.id, j.nome, m.classe, m.itens, m.vitorias, m.vidas
  from mochilas m join jogadores j on j.id = m.jogador_id
  where m.versao = p_versao and m.rodada = p_rodada and not j.bloqueado and m.jogador_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000')
  order by abs(m.liga - liga_de(coalesce((select pontos from ranking where jogador_id = auth.uid() and temporada = temporada_atual()), 0))) * 3
           + abs(m.vitorias - p_vitorias), random()
  limit 1
$$;

-- ranking com a liga de cada um
drop function if exists public.ranking_temporada(int);
create function public.ranking_temporada(p_limite int default 100)
returns table (posicao bigint, nome text, pontos integer, vitorias integer, melhor_campanha smallint, liga smallint)
language sql stable security definer set search_path = public as $$
  select rank() over (order by r.pontos desc, r.vitorias desc), j.nome, r.pontos, r.vitorias, r.melhor_campanha, liga_de(r.pontos)
  from ranking r join jogadores j on j.id = r.jogador_id
  where r.temporada = temporada_atual() and not j.bloqueado and (r.corridas > 0 or r.pontos > 0)
  order by r.pontos desc, r.vitorias desc
  limit least(p_limite, 200)
$$;

-- os meus pontos, liga, posição e o melhor da temporada
create or replace function public.meu_rank()
returns table (pontos integer, liga smallint, posicao bigint, melhor_pontos integer, corridas integer, temporada smallint, fim date)
language sql stable security definer set search_path = public as $$
  with t as (select id, fim from temporadas where id = temporada_atual()), eu as (select * from ranking where jogador_id = auth.uid() and temporada = (select id from t))
  select coalesce((select pontos from eu), 0), liga_de(coalesce((select pontos from eu), 0)),
    (select count(*) + 1 from ranking r join jogadores j on j.id = r.jogador_id where r.temporada = (select id from t) and not j.bloqueado and r.pontos > coalesce((select pontos from eu), 0)),
    coalesce((select melhor_pontos from eu), 0), coalesce((select corridas from eu), 0), (select id from t), (select fim from t)
$$;

revoke all on function public.liga_de(int), public.linha_ranking(uuid), public.aplicar_rank(bigint, integer), public.mochila_com_liga() from public, anon, authenticated;
grant execute on function public.liga_de(int) to anon, authenticated;
revoke all on function public.iniciar_corrida(text, text), public.meu_rank() from public, anon;
grant execute on function public.iniciar_corrida(text, text), public.meu_rank(), public.registrar_luta(boolean, int) to authenticated;
grant execute on function public.ranking_temporada(int), public.sortear_adversario(int, int, int) to anon, authenticated;
