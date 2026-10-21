# Frontend CineCena

O frontend usa HTML, CSS e JavaScript puro.

## Organização

- **HTML:** estrutura, seções e textos.
- **CSS:** visual e responsividade.
- **JavaScript:** comportamento e componentes reutilizáveis.
- **data.js:** curadoria local com 100 filmes e listas editoriais.
- **tmdb.js:** integração com o TMDB.

Não existe um `app.js` responsável por montar páginas inteiras. Para alterar estrutura e conteúdo editorial, comece pelo arquivo correspondente em `pages/`.

## Páginas de catálogo

- `movies.html`: catálogo completo do CineCena.
- `list.html`: catálogo contextual carregado por query string (`?list=`, `?type=` ou `?source=`).
- `movie.html`: página completa de um filme, carregada por `?movie=Nome do filme`.

## Integração com o backend

A API é definida em `assets/js/api.js` (Render por padrão). Para testar com Django local, defina `window.CINECENA_BACKEND_URL = "http://127.0.0.1:8000"` em `assets/js/config.js` e publique o frontend por um servidor HTTP (por exemplo, Live Server em `http://127.0.0.1:5500`).

A autenticação guarda apenas o token e os dados mínimos da sessão no `localStorage`. As alterações de usuário — perfil, avatar, reviews, posts, comentários, curtidas, favoritos, assistidos e listas — são persistidas pelo backend. O cache local do TMDB continua limitado a metadados públicos do catálogo.

**Dependência de deploy:** aplique as migrations Django novas antes de publicar o frontend. Configure `CORS_ALLOWED_ORIGINS` no Render para incluir `https://nativafatec.github.io` caso já exista uma variável de ambiente substituindo os valores padrão. Consulte `RELATORIO_CINECENA.md` na raiz.
