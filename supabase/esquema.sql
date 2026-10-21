-- Bornal de Guerra · banco do modo online assíncrono e do ranking, no Supabase (plano gratuito)
-- Como usar: no painel do Supabase, SQL Editor > New query > colar este arquivo inteiro > Run. Pode rodar de novo sem estragar nada.
--
-- Como funciona:
--  * cada jogador entra sem cadastro (login anônimo do Supabase); o nome que aparece no ranking é escolhido no jogo;
--  * a cada rodada, o jogo envia uma foto da mochila (os itens e onde estão) e pede uma mochila de outro jogador da mesma rodada;
--  * a luta roda no aparelho; o resultado volta e soma pontos no ranking da temporada;
--  * ninguém escreve direto nas tabelas: tudo passa pelas funções abaixo, que conferem os dados (contra trapaça simples);
--  * para caber no plano grátis, só as 300 mochilas mais recentes de cada rodada ficam guardadas.

-- ---------- tabelas ----------
create table if not exists public.jogadores (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default 'Aventureiro' check (char_length(nome) between 2 and 20),
  criado_em timestamptz not null default now()
);

create table if not exists public.mochilas (
  id bigint generated always as identity primary key,
  jogador_id uuid not null references public.jogadores (id) on delete cascade,
  rodada smallint not null check (rodada between 1 and 30),
  classe text not null check (char_length(classe) between 2 and 20),
  versao smallint not null default 1,          -- versão das regras do jogo (mochilas de versões antigas não são sorteadas)
  itens jsonb not null,                          -- [{"id":"espada","x":0,"y":1,"giro":0}, ...]
  vitorias smallint not null default 0,          -- campanha do jogador até ali (para o adversário ter força parecida)
  vidas smallint not null default 5,
  criado_em timestamptz not null default now(),
  check (jsonb_typeof(itens) = 'array' and jsonb_array_length(itens) <= 40)
);
create index if not exists mochilas_rodada_idx on public.mochilas (versao, rodada, criado_em desc);

create table if not exists public.temporadas (
  id smallint primary key,
  nome text not null,
  inicio date not null,
  fim date not null
);
insert into public.temporadas (id, nome, inicio, fim) values (1, 'Temporada 1', current_date, current_date + 60)
on conflict (id) do nothing;

create table if not exists public.ranking (
  temporada smallint not null references public.temporadas (id),
  jogador_id uuid not null references public.jogadores (id) on delete cascade,
  pontos integer not null default 0,
  vitorias integer not null default 0,
  derrotas integer not null default 0,
  melhor_campanha smallint not null default 0,  -- mais vitórias numa mesma corrida
  lutas_hoje smallint not null default 0,
  dia date not null default current_date,
  atualizado_em timestamptz not null default now(),
  primary key (temporada, jogador_id)
);
create index if not exists ranking_pontos_idx on public.ranking (temporada, pontos desc);

-- ---------- segurança: todos podem ler; ninguém escreve direto ----------
alter table public.jogadores enable row level security;
alter table public.mochilas enable row level security;
alter table public.temporadas enable row level security;
alter table public.ranking enable row level security;

drop policy if exists "ler jogadores" on public.jogadores;
create policy "ler jogadores" on public.jogadores for select using (true);
drop policy if exists "ler temporadas" on public.temporadas;
create policy "ler temporadas" on public.temporadas for select using (true);
drop policy if exists "ler ranking" on public.ranking;
create policy "ler ranking" on public.ranking for select using (true);
-- as mochilas não são lidas direto: só uma por vez, sorteada pela função sortear_adversario

-- ---------- funções que o jogo chama ----------
-- a temporada de hoje
create or replace function public.temporada_atual() returns smallint
language sql stable as $$
  select id from public.temporadas where current_date between inicio and fim order by id desc limit 1
$$;

-- cria ou renomeia o jogador (nome curto, sem espaços nas pontas)
create or replace function public.definir_nome(novo_nome text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sem login'; end if;
  novo_nome := btrim(novo_nome);
  if char_length(novo_nome) not between 2 and 20 then raise exception 'nome deve ter de 2 a 20 letras'; end if;
  insert into jogadores (id, nome) values (auth.uid(), novo_nome)
  on conflict (id) do update set nome = excluded.nome;
end $$;

-- guarda a mochila da rodada e devolve o id dela
create or replace function public.enviar_mochila(p_rodada int, p_classe text, p_versao int, p_itens jsonb, p_vitorias int, p_vidas int) returns bigint
language plpgsql security definer set search_path = public as $$
declare novo bigint;
begin
  if auth.uid() is null then raise exception 'sem login'; end if;
  insert into jogadores (id) values (auth.uid()) on conflict (id) do nothing;
  insert into mochilas (jogador_id, rodada, classe, versao, itens, vitorias, vidas)
  values (auth.uid(), p_rodada, p_classe, p_versao, p_itens, greatest(0, least(p_vitorias, 30)), greatest(0, least(p_vidas, 10)))
  returning id into novo;
  -- só as 300 mais recentes de cada rodada ficam (o plano grátis tem 500 MB)
  delete from mochilas m where m.versao = p_versao and m.rodada = p_rodada and m.id in (
    select id from mochilas where versao = p_versao and rodada = p_rodada order by criado_em desc offset 300);
  return novo;
end $$;

-- sorteia a mochila de outro jogador na mesma rodada (preferindo campanha parecida); nada se não houver nenhuma
create or replace function public.sortear_adversario(p_rodada int, p_versao int, p_vitorias int)
returns table (id bigint, nome text, classe text, itens jsonb, vitorias smallint, vidas smallint)
language sql security definer set search_path = public as $$
  select m.id, j.nome, m.classe, m.itens, m.vitorias, m.vidas
  from mochilas m join jogadores j on j.id = m.jogador_id
  where m.versao = p_versao and m.rodada = p_rodada and m.jogador_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000')
  order by abs(m.vitorias - p_vitorias), random()
  limit 1
$$;

-- registra o resultado de uma luta online: vitória 10 pontos, derrota 0 (o ranking não cai), no máximo 60 lutas por dia
create or replace function public.registrar_luta(p_venceu boolean, p_campanha int) returns integer
language plpgsql security definer set search_path = public as $$
declare t smallint := temporada_atual(); r ranking;
begin
  if auth.uid() is null then raise exception 'sem login'; end if;
  if t is null then return 0; end if;
  insert into ranking (temporada, jogador_id) values (t, auth.uid()) on conflict do nothing;
  select * into r from ranking where temporada = t and jogador_id = auth.uid() for update;
  if r.dia <> current_date then r.lutas_hoje := 0; end if;
  if r.lutas_hoje >= 60 then return r.pontos; end if;
  update ranking set
    pontos = pontos + case when p_venceu then 10 else 0 end,
    vitorias = vitorias + case when p_venceu then 1 else 0 end,
    derrotas = derrotas + case when p_venceu then 0 else 1 end,
    melhor_campanha = greatest(melhor_campanha, least(p_campanha, 30)),
    lutas_hoje = r.lutas_hoje + 1, dia = current_date, atualizado_em = now()
  where temporada = t and jogador_id = auth.uid()
  returning pontos into r.pontos;
  return r.pontos;
end $$;

-- os 100 primeiros da temporada (para a tela do ranking)
create or replace function public.ranking_temporada(p_limite int default 100)
returns table (posicao bigint, nome text, pontos integer, vitorias integer, melhor_campanha smallint)
language sql stable security definer set search_path = public as $$
  select rank() over (order by r.pontos desc, r.vitorias desc), j.nome, r.pontos, r.vitorias, r.melhor_campanha
  from ranking r join jogadores j on j.id = r.jogador_id
  where r.temporada = temporada_atual()
  order by r.pontos desc, r.vitorias desc
  limit least(p_limite, 200)
$$;

-- quem está logado pode chamar as funções; quem não está, só ler o ranking
revoke all on function public.definir_nome(text), public.enviar_mochila(int, text, int, jsonb, int, int), public.registrar_luta(boolean, int) from public, anon;
grant execute on function public.definir_nome(text), public.enviar_mochila(int, text, int, jsonb, int, int), public.registrar_luta(boolean, int) to authenticated;
grant execute on function public.sortear_adversario(int, int, int), public.ranking_temporada(int), public.temporada_atual() to anon, authenticated;

-- segunda camada: além da RLS, quem joga não tem permissão de escrever direto em nenhuma tabela (só pelas funções acima)
revoke insert, update, delete, truncate on public.jogadores, public.mochilas, public.temporadas, public.ranking from anon, authenticated;

-- leitura liberada de propósito (o projeto foi criado sem expor tabelas novas automaticamente): só ler, e a RLS decide o que aparece
grant usage on schema public to anon, authenticated;
grant select on public.jogadores, public.temporadas, public.ranking to anon, authenticated;
