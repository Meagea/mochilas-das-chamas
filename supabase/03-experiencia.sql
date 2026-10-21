-- Bornal de Guerra · experiência dos personagens (PROGRESSAO.md) e multiplicador para assinatura/boost no futuro
-- Rodar uma vez no SQL Editor (depois do esquema.sql e do 02-amostra-robos.sql). Pode rodar de novo sem estragar nada.
--
-- Como funciona:
--  * no começo da partida o jogo chama iniciar_corrida(classe) e recebe o número da partida;
--  * a cada rodada, enviar_mochila(..., p_corrida) guarda a mochila como antes e soma a rodada na partida
--    (só conta a rodada seguinte da sequência e com pelo menos 3 s desde a anterior: não dá para inventar rodadas);
--  * no fim, fechar_corrida(partida, vitórias) calcula a experiência aqui no servidor:
--      2 por rodada + 3 por vitória + 10 ao fechar 7 vitórias, vezes o multiplicador do jogador,
--      com as vitórias limitadas pelo que é possível naquelas rodadas (7 vitórias / 3 derrotas) e até 250 por dia (vezes o multiplicador);
--  * o jogo guarda só a experiência total; o nível (1 a 10) e as estrelas de prestígio saem dela, no próprio jogo;
--  * ninguém escreve direto nas tabelas, e cada um só lê a própria experiência (minha_experiencia).
-- Hoje todo mundo tem multiplicador 1. Para dar um boost a alguém (teste):
--   update public.multiplicadores set boost_partidas = 10 where jogador_id = '<id>';

create table if not exists public.experiencia (
  jogador_id uuid not null references public.jogadores (id) on delete cascade,
  classe text not null check (classe ~ '^[a-z]{2,20}$'),
  xp integer not null default 0,
  partidas integer not null default 0,
  atualizado_em timestamptz not null default now(),
  primary key (jogador_id, classe)
);

create table if not exists public.multiplicadores (
  jogador_id uuid primary key references public.jogadores (id) on delete cascade,
  assinatura_mult numeric(3, 2) not null default 1.5,   -- quanto a assinatura multiplica, enquanto estiver ativa
  assinatura_ate timestamptz,                             -- vazio ou no passado: sem assinatura
  boost_mult numeric(3, 2) not null default 2,
  boost_partidas smallint not null default 0,             -- partidas com boost que ainda restam
  xp_hoje integer not null default 0,
  dia date not null default current_date
);

create table if not exists public.corridas (
  id bigint generated always as identity primary key,
  jogador_id uuid not null references public.jogadores (id) on delete cascade,
  classe text not null check (classe ~ '^[a-z]{2,20}$'),
  rodadas smallint not null default 0,
  ultima_rodada_em timestamptz,
  fechada boolean not null default false,
  criada_em timestamptz not null default now()
);
create index if not exists corridas_jogador_idx on public.corridas (jogador_id, criada_em desc);

alter table public.experiencia enable row level security;
alter table public.multiplicadores enable row level security;
alter table public.corridas enable row level security;
revoke all on public.experiencia, public.multiplicadores, public.corridas from anon, authenticated;

-- começa uma partida: fecha (sem experiência) as que ficaram abertas e devolve o número da nova
create or replace function public.iniciar_corrida(p_classe text) returns bigint
language plpgsql security definer set search_path = public as $$
declare novo bigint;
begin
  if auth.uid() is null then raise exception 'sem login'; end if;
  if p_classe !~ '^[a-z]{2,20}$' then raise exception 'classe inválida'; end if;
  insert into jogadores (id) values (auth.uid()) on conflict (id) do nothing;
  update corridas set fechada = true where jogador_id = auth.uid() and not fechada;
  delete from corridas where jogador_id = auth.uid() and criada_em < now() - interval '7 days';
  insert into corridas (jogador_id, classe) values (auth.uid(), p_classe) returning id into novo;
  return novo;
end $$;

-- a mesma enviar_mochila de antes, agora sabendo de qual partida é (a versão sem p_corrida continua valendo para jogos antigos)
create or replace function public.enviar_mochila(p_rodada int, p_classe text, p_versao int, p_itens jsonb, p_vitorias int, p_vidas int, p_corrida bigint) returns bigint
language plpgsql security definer set search_path = public as $$
declare novo bigint;
begin
  novo := enviar_mochila(p_rodada, p_classe, p_versao, p_itens, p_vitorias, p_vidas);
  update corridas set rodadas = rodadas + 1, ultima_rodada_em = now()
  where id = p_corrida and jogador_id = auth.uid() and not fechada and classe = p_classe
    and rodadas + 1 = p_rodada and rodadas < 9 and criada_em > now() - interval '1 day'
    and (ultima_rodada_em is null or ultima_rodada_em < now() - interval '3 seconds');
  return novo;
end $$;

-- fecha a partida e soma a experiência; devolve quanto ganhou e o total daquela classe
create or replace function public.fechar_corrida(p_corrida bigint, p_vitorias int)
returns table (ganho integer, xp integer, base integer, multiplicador numeric, limite_hoje integer)
language plpgsql security definer set search_path = public as $$
declare c corridas; m multiplicadores; v int; b int; mult numeric := 1; lim int; g int; total int;
begin
  if auth.uid() is null then raise exception 'sem login'; end if;
  select * into c from corridas where id = p_corrida and jogador_id = auth.uid() and not fechada for update;
  if c.id is null then raise exception 'partida não encontrada ou já fechada'; end if;
  update corridas set fechada = true where id = c.id;
  -- vitórias possíveis: no máximo 7, e no máximo 3 derrotas no meio das rodadas jogadas
  v := greatest(least(coalesce(p_vitorias, 0), 7, c.rodadas), greatest(c.rodadas - 3, 0));
  b := c.rodadas * 2 + v * 3 + case when v >= 7 then 10 else 0 end;
  insert into multiplicadores (jogador_id) values (auth.uid()) on conflict (jogador_id) do nothing;
  select * into m from multiplicadores where jogador_id = auth.uid() for update;
  if m.dia <> current_date then m.xp_hoje := 0; end if;
  if m.assinatura_ate is not null and m.assinatura_ate > now() then mult := mult * m.assinatura_mult; end if;
  if m.boost_partidas > 0 and c.rodadas > 0 then mult := mult * m.boost_mult; end if;
  lim := floor(250 * mult);
  g := least(floor(b * mult)::int, greatest(lim - m.xp_hoje, 0));
  update multiplicadores set xp_hoje = m.xp_hoje + g, dia = current_date,
    boost_partidas = case when m.boost_partidas > 0 and c.rodadas > 0 then m.boost_partidas - 1 else m.boost_partidas end
  where jogador_id = auth.uid();
  insert into experiencia (jogador_id, classe, xp, partidas) values (auth.uid(), c.classe, g, 1)
  on conflict (jogador_id, classe) do update set xp = experiencia.xp + g, partidas = experiencia.partidas + 1, atualizado_em = now()
  returning experiencia.xp into total;
  return query select g, total, b, mult, lim - (m.xp_hoje + g);
end $$;

-- a experiência do jogador em cada classe, e o multiplicador que vale agora
create or replace function public.minha_experiencia()
returns table (classe text, xp integer, partidas integer, multiplicador numeric, boost_partidas smallint, assinatura_ate timestamptz)
language sql stable security definer set search_path = public as $$
  with m as (select * from multiplicadores where jogador_id = auth.uid())
  select e.classe, e.xp, e.partidas,
         (case when (select assinatura_ate from m) > now() then (select assinatura_mult from m) else 1 end)
         * (case when coalesce((select boost_partidas from m), 0) > 0 then (select boost_mult from m) else 1 end),
         coalesce((select boost_partidas from m), 0::smallint), (select assinatura_ate from m)
  from experiencia e where e.jogador_id = auth.uid()
$$;

revoke all on function public.iniciar_corrida(text), public.enviar_mochila(int, text, int, jsonb, int, int, bigint),
  public.fechar_corrida(bigint, int), public.minha_experiencia() from public, anon;
grant execute on function public.iniciar_corrida(text), public.enviar_mochila(int, text, int, jsonb, int, int, bigint),
  public.fechar_corrida(bigint, int), public.minha_experiencia() to authenticated;
