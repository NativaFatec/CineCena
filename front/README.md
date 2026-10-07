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

## Estado local do protótipo

Favoritos, curtidos, assistidos, filmes adicionados à lista, reviews, posts e perfil são mantidos em `localStorage` enquanto o backend ainda não está conectado.

Os quatro favoritos são independentes de **Amei**. A ação **Amei** alimenta a seção de filmes curtidos e **Marcar como assistido** alimenta o histórico de assistidos. As coleções usam a interação mais recente primeiro.
