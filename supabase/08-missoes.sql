-- Bornal de Guerra · missões diárias: 3 por dia para cada jogador, conferidas no servidor e pagas em bronze
-- Rodar no SQL Editor depois do 07-estatisticas.sql (rode o 07 de novo antes: ele passou a guardar as vitórias de cada corrida).
-- Pode rodar de novo sem estragar nada.
--
-- Como funciona:
--  * todo dia (no fuso do servidor) cada jogador recebe 3 das 5 missões abaixo, sorteadas pelo próprio id e pela data;
--  * o progresso vem das corridas fechadas hoje (corridas.vitorias e corridas.fechada_em, gravadas pelo aplicar_rank do 07);
--  * resgatar_missao paga o bronze uma vez só; jogador bloqueado (05-nomes.sql) não resgata.

create table if not exists public.missoes_resgatadas (
  jogador_id uuid not null references public.jogadores (id) on delete cascade,
  dia date not null default current_date,
  n smallint not null check (n between 1 and 3),
  primary key (jogador_id, dia, n)
);
alter table public.missoes_resgatadas enable row level security;
revoke all on public.missoes_resgatadas from anon, authenticated;

-- as 3 missões do dia de um jogador: tipo, classe (só na missão de classe), meta e bronze
create or replace function public.missoes_do_dia(p_jogador uuid)
returns table (n smallint, tipo text, classe text, meta integer, bronze integer)
language sql stable security definer set search_path = public as $$
  with tipos(tipo, meta, bronze) as (values ('vitorias', 8, 30), ('classe', 4, 40), ('corridas', 2, 30), ('ranqueada', 1, 50), ('campanha', 5, 60)),
  classes as (select array['guerreiro', 'mago', 'ladino', 'ferreiro', 'herbalista', 'alquimista', 'coureiro', 'joalheiro', 'inventor', 'cervejeiro', 'cozinheiro'] as l),
  escolha as (select t.*, row_number() over (order by md5(p_jogador::text || current_date::text || t.tipo)) as k from tipos t)
  select e.k::smallint, e.tipo,
    case when e.tipo = 'classe' then (select l[1 + abs(hashtext(p_jogador::text || current_date::text)) % 11] from classes) end,
    e.meta, e.bronze
  from escolha e where e.k <= 3 order by e.k
$$;

-- o progresso de cada missão hoje, pelas corridas fechadas hoje
create or replace function public.minhas_missoes()
returns table (n smallint, tipo text, classe text, meta integer, progresso integer, bronze integer, resgatada boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sem login'; end if;
  return query
  with hoje as (select c.classe, c.modo, coalesce(c.vitorias, 0) as v from corridas c
                where c.jogador_id = auth.uid() and c.fechada and c.fechada_em >= current_date and c.rodadas > 0)
  select m.n, m.tipo, m.classe, m.meta,
    least(m.meta, case m.tipo
      when 'vitorias' then (select coalesce(sum(v), 0) from hoje)
      when 'classe' then (select coalesce(sum(v), 0) from hoje h where h.classe = m.classe)
      when 'corridas' then (select count(*) from hoje)
      when 'ranqueada' then (select count(*) from hoje h where h.modo = 'ranqueada' and h.v >= 4)
      when 'campanha' then (select coalesce(max(v), 0) from hoje)
    end)::integer,
    m.bronze,
    exists (select 1 from missoes_resgatadas r where r.jogador_id = auth.uid() and r.dia = current_date and r.n = m.n)
  from missoes_do_dia(auth.uid()) m;
end $$;

-- paga a missão n (1 a 3) se estiver completa e ainda não paga; devolve o bronze novo da carteira
create or replace function public.resgatar_missao(p_n smallint) returns integer
language plpgsql security definer set search_path = public as $$
declare m record; saldo integer;
begin
  if auth.uid() is null then raise exception 'sem login'; end if;
  if esta_bloqueado() then raise exception 'jogador bloqueado'; end if;
  select * into m from minhas_missoes() x where x.n = p_n;
  if m.n is null then raise exception 'missão não encontrada'; end if;
  if m.resgatada then raise exception 'missão já resgatada'; end if;
  if m.progresso < m.meta then raise exception 'missão incompleta'; end if;
  insert into missoes_resgatadas (jogador_id, dia, n) values (auth.uid(), current_date, p_n);
  insert into carteira (jogador_id, bronze) values (auth.uid(), m.bronze)
    on conflict (jogador_id) do update set bronze = carteira.bronze + excluded.bronze
    returning bronze into saldo;
  return saldo;
end $$;

revoke all on function public.missoes_do_dia(uuid) from public, anon, authenticated;
revoke all on function public.minhas_missoes(), public.resgatar_missao(smallint) from public, anon;
grant execute on function public.minhas_missoes(), public.resgatar_missao(smallint) to authenticated;
