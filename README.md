# Horizon

Biblioteca pessoal de mídia: animes, filmes e séries, jogos e livros num só lugar, com lista de prioridade (Top 10), categorias personalizadas, integração com a Steam e funcionamento offline. Roda na web e como app Android (Capacitor).

## Recursos

- **Quatro bibliotecas** (animes, filmes e séries, jogos, livros) com status, nota, datas de conclusão e fichas detalhadas ("dossiê") de cada obra.
- **Top 10 por categoria**: lista de prioridade reordenável, com carrossel na tela inicial.
- **Categorias personalizadas** com campos próprios, fotos e artefatos de conclusão (ingresso, passaporte, cartão de save etc.).
- **Catálogos externos** (IGDB, TMDB, Steam, Google Books, BrasilAPI, HowLongToBeat, YouTube) acessados por um proxy no servidor, sem expor chaves ao navegador.
- **Integração com a Steam**: login OpenID, importação da biblioteca e enriquecimento dos jogos.
- **Offline first**: leitura pelo cache local e edições enfileiradas, sincronizadas ao reconectar (veja abaixo).
- **Conta e segurança**: Supabase Auth, MFA (TOTP), captcha Turnstile e exclusão de conta com confirmação de senha.
- **Notificações push** (Firebase Cloud Messaging) para lembretes semanais, sincronização da Steam e novas versões do app.

## Tecnologias

React 19, TypeScript, Vite, Tailwind CSS 3, React Router, React Hook Form + Zod, Supabase (Auth, Postgres, Storage), Capacitor 8 (Android), funções serverless na Vercel (`api/`) e Firebase Admin para push.

## Como rodar

Requisitos: Node 22 e um projeto Supabase.

```bash
npm install
cp .env.example .env.local   # se não existir, crie o arquivo com as variáveis abaixo
npm run dev
```

O `vite dev` já serve as rotas de `api/` (proxy de catálogo e Steam). As demais funções (push, exclusão de conta) só rodam na Vercel ou com `vercel dev`.

### Variáveis de ambiente

| Variável | Onde | Para quê |
| --- | --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | cliente | Conexão com o Supabase |
| `VITE_SITE_URL` | cliente | URL pública do site (redirecionamentos de login) |
| `VITE_API_ORIGIN` | cliente | Origem da API quando o app nativo fala com o servidor |
| `VITE_TURNSTILE_SITE_KEY` | cliente | Captcha Cloudflare Turnstile |
| `VITE_APP_VERSION` | build | Versão exibida e comparada nas atualizações; o CI usa a da tag, localmente vale a do `package.json` |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | servidor | Cliente administrativo das funções |
| `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET` | servidor | Catálogo de jogos |
| `TMDB_ACCESS_TOKEN` (ou `TMDB_API_KEY`) | servidor | Catálogo de filmes e séries |
| `GOOGLE_BOOKS_API_KEY` | servidor | Catálogo de livros |
| `STEAM_API_KEY` | servidor | Integração com a Steam |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | servidor | Envio de push |
| `PUSH_NOTIFICATION_SECRET` | servidor | Autoriza o aviso de nova versão disparado pelo CI |
| `CRON_SECRET` | servidor | Autoriza o cron de lembretes semanais |

Atenção: variáveis com prefixo `VITE_` vão para o bundle do navegador. Chaves e segredos de servidor não devem ter esse prefixo.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checagem de tipos e build de produção |
| `npm run lint` | ESLint |
| `npm test` | Testes (`node --test`) em `server/tests` |
| `npm run cap:sync` | Build e sincronização com o projeto Android |
| `npm run cap:android` | Abre o projeto no Android Studio |

## Estrutura

```
src/
  components/   componentes de interface (MediaCard, PriorityList, diálogos…)
  screens/      telas e seus hooks (biblioteca, configurações, autenticação)
  services/     acesso a dados: Supabase, catálogos, cache offline, push
  schemas/      DTOs validados com Zod
  hooks/, utils/, consts/, lib/
api/            funções serverless da Vercel
server/         código compartilhado das funções (Supabase admin, Steam, push) e testes
android/        projeto nativo do Capacitor
```

## Offline e sincronização

O cache local fica no IndexedDB. Quando não há conexão, cada edição é aplicada ao cache e entra numa fila (`src/services/offlineStore`). Ao reconectar, a fila é reproduzida em ordem (`syncQueue.ts`, com testes):

- **Erros temporários** (5xx, 429, timeout) são repetidos com espera crescente (30 s, 1 min, 2 min… até 1 h), no máximo 6 vezes. Sem rede ou com a sessão expirada, a rodada para sem gastar tentativas.
- **Erros definitivos** (dado recusado pelo servidor) marcam a operação como falha e a fila segue. Uma operação com problema só segura as seguintes do mesmo item.
- **Conflitos**: cada edição guarda o valor que o aparelho via ao editar. No envio, o servidor é comparado campo a campo: o que ninguém mexeu é aplicado, o que foi alterado em outro aparelho mantém a versão do servidor e o usuário é avisado. Item apagado em outro lugar faz a edição ser ignorada.
- Apenas uma sincronização roda por vez, inclusive entre abas.

## Publicação

- **Web**: deploy na Vercel (`vercel.json` define o fallback para o SPA e o cron semanal de lembretes).
- **Android**: ao criar uma tag `vX.Y.Z`, o workflow `.github/workflows/android-release.yml` roda o lint, gera o APK assinado e publica a release no GitHub. Depois avisa os usuários por push. Os segredos de assinatura (`ANDROID_KEYSTORE_*`, `ANDROID_KEY_*`), do Firebase e do Supabase ficam nos Secrets do repositório.
