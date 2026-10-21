-- Bornal de Guerra · robôs até haver jogadores suficientes
-- Rodar uma vez no SQL Editor (depois do esquema.sql). Pode rodar de novo sem estragar nada.
--
-- Os robôs nunca vão para o banco: o jogo monta a mochila deles no próprio aparelho. Esta parte só diz ao jogo
-- quantos jogadores diferentes já deixaram mochila naquela rodada, e qual é o mínimo para lutar só contra gente.
-- Abaixo do mínimo, o jogo mistura: a chance de pegar um jogador é (jogadores ÷ mínimo); o resto é robô.
-- Para tirar os robôs de vez: update public.config set valor = 0 where chave = 'min_jogadores_rodada';
-- Para exigir mais gente antes de tirar: troque o 20 pelo número desejado com o mesmo update.

create table if not exists public.config (chave text primary key, valor integer not null);
insert into public.config (chave, valor) values ('min_jogadores_rodada', 20) on conflict (chave) do nothing;
alter table public.config enable row level security;
revoke all on public.config from anon, authenticated;

create or replace function public.amostra_rodada(p_rodada int, p_versao int)
returns table (jogadores bigint, minimo integer)
language sql stable security definer set search_path = public as $$
  select (select count(distinct jogador_id) from mochilas
          where versao = p_versao and rodada = p_rodada and jogador_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000')),
         coalesce((select valor from config where chave = 'min_jogadores_rodada'), 20)
$$;
grant execute on function public.amostra_rodada(int, int) to anon, authenticated;
