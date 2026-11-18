# Programação da WAY OUT Radio

## Criar e publicar programas

Entra no [painel da WAY OUT Radio](https://wayout.pages.dev/admin/) com a
chave de acesso da equipa. Para criar um programa, indica um nome, data,
hora de início e duração. Podes acrescentar o nome do DJ e uma descrição,
e escolher entre uma data única ou repetição semanal.

Marca **Mostrar na grelha pública** e carrega em **Publicar programa**.
Também podes guardar como rascunho, editar e retirar um programa da grelha
desmarcando a opção de publicação. Isso afeta a grelha do site. Os DJs
continuam a ligar-se pelo [Web DJ](DJ-GUIDE.md) e o AutoDJ gere a música.

A grelha mostra os programas em curso e os próximos sete dias de calendário,
incluindo hoje, em hora de Lisboa. A homepage consulta a
programação ao carregar e a cada 30 segundos enquanto está visível. Na mudança
da hora, uma repetição marcada para uma hora que não existe nessa data é
omitida. Se a hora se repetir, o programa começa na primeira ocorrência.

## Pré-visualização local

Na raiz do repositório, cria uma chave local se ainda não tiveres um ficheiro
`.dev.vars`. Guarda esse ficheiro junto ao `wrangler.jsonc`, fora de `site/`.

```sh
(umask 077; set -C; printf 'ADMIN_ACCESS_KEY=%s\n' "$(openssl rand -hex 32)" > .dev.vars)
npx wrangler d1 migrations apply PROGRAMACAO_DB --local
npx wrangler pages dev site --ip 127.0.0.1 --port 8789
```

Abre o [painel local](http://127.0.0.1:8789/admin/) e usa o valor à direita
de `ADMIN_ACCESS_KEY=`. O estado local fica em `.wrangler/`. Podes criar
programas de teste nessa base. A chave e os dados locais ficam fora do Git.

## Configuração de produção

O projeto Pages `wayout` usa a base D1 `pomboradio-programacao`,
associada em **Settings → Bindings → Production** como
`PROGRAMACAO_DB`. A chave de produção fica em **Variables and Secrets**
com o nome `ADMIN_ACCESS_KEY`. Ao criar ou rodar a chave, gera 64
caracteres hexadecimais com `openssl rand -hex 32` e guarda o valor no
teu gestor de palavras-passe.

A configuração `wrangler.jsonc` no repo destina-se ao ambiente local.
Para aplicar migrações em produção, usa uma configuração Wrangler separada
que aponte para o ID real de `pomboradio-programacao` e para a pasta
`migrations/`. Executa
`npx wrangler d1 migrations apply PROGRAMACAO_DB --remote --config <configuração>`
antes de publicar código que precise da nova estrutura.

Para ativar uma chave nova, atualiza o segredo e volta a publicar. As
sessões emitidas com a chave anterior expiram na nova publicação. Usa
uma base de dados e uma chave próprias se ativares previews na Cloudflare.
[Guia de publicação](OPERATOR-GUIDE.md#deploy-and-verify-the-website)
