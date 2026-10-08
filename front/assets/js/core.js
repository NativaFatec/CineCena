(() => {
  const Data = window.CineCenaData;
  const TMDB = window.CineCenaTMDB;

  /*
   * ============================================================
   * CONFIGURAÇÃO DA API DE FAVORITOS
   * ============================================================
   *
   * Os favoritos NÃO são mais armazenados no localStorage.
   *
   * localStorage continua sendo utilizado apenas para:
   * - token
   * - user
   * - alguns estados antigos do frontend
   *
   * Os favoritos vêm do:
   *
   * Frontend → Django → Supabase/PostgreSQL
   *
   */
  const FAVORITES_API_URL =
    "http://127.0.0.1:8000/api/movies/favorites/";

  /*
   * Limite de favoritos exibidos no perfil.
   */
  const FAVORITE_LIMIT = 5;

  /*
   * ============================================================
   * ESTADO DOS FAVORITOS
   * ============================================================
   *
   * IMPORTANTE:
   *
   * Isto fica somente na memória da página.
   *
   * NÃO usamos localStorage aqui.
   *
   * Quando a página é fechada, essa variável desaparece.
   * Os dados verdadeiros continuam no banco.
   */
  const favoriteState = {
    items: [],
    loading: false
  };

  /*
   * ============================================================
   * CHAVES LOCAIS
   * ============================================================
   *
   * NÃO colocar favoritos aqui.
   */
  const KEYS = {
    friend: "cinecena.friend.glauber",
    profile: "cinecena.profile",
    reviews: "cinecena.reviews",
    posts: "cinecena.posts",
    movieState: "cinecena.movie-state"
  };

  /*
   * ============================================================
   * FUNÇÕES DE STORAGE
   * ============================================================
   */

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);

      if (!raw) {
        return fallback;
      }

      const parsed = JSON.parse(raw);

      return parsed ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  }

  /*
   * ============================================================
   * ESTADO PRINCIPAL DO CINECENA
   * ============================================================
   */

  const state = {
    movies: Data.curatedMovies,

    tmdbReady: TMDB.isConfigured(),

    loadingMovies: false,

    glauberPhoto: "",

    friend:
      localStorage.getItem(KEYS.friend) === "true",

    profile: readJSON(
      KEYS.profile,
      {
        name: "Usuário CineCena",
        description:
          "Apaixonado por cinema brasileiro."
      }
    ),

    /*
     * Estes continuam locais por enquanto.
     *
     * IMPORTANTE:
     * favorites NÃO está aqui.
     */
    reviews: readJSON(
      KEYS.reviews,
      []
    ),

    posts: readJSON(
      KEYS.posts,
      []
    ),

    movieState: readJSON(
      KEYS.movieState,
      {}
    )
  };

  /*
   * ============================================================
   * UTILITÁRIOS
   * ============================================================
   */

  function escapeHTML(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function movieYear(movie) {
    return (
      movie?.year ||
      (
        movie?.release_date
          ? String(movie.release_date).slice(0, 4)
          : "—"
      )
    );
  }

  function posterURL(movie) {
    return (
      movie?.poster ||
      TMDB.posterUrl(
        movie?.poster_path || ""
      )
    );
  }

  function initials(name = "") {
    return String(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join("")
      .toUpperCase();
  }

  function movieKey(movie) {
    return String(
      movie?.catalogKey ??
      movie?.tmdb_id ??
      movie?.id ??
      movie?.title ??
      ""
    );
  }

  function findMovie(keyOrTitle) {
    const wanted =
      String(keyOrTitle ?? "");

    return state.movies.find(
      movie =>
        movieKey(movie) === wanted ||
        String(movie?.tmdb_id ?? "") === wanted ||
        String(movie?.id ?? "") === wanted ||
        movie.title === wanted
    );
  }

  function genresText(movie, max = 2) {
    const genres =
      Array.isArray(movie?.genres)
        ? movie.genres
            .map(
              genre =>
                typeof genre === "string"
                  ? genre
                  : genre?.name
            )
            .filter(Boolean)
        : [];

    return (
      genres
        .slice(0, max)
        .join(" · ") ||
      "Cinema brasileiro"
    );
  }

  /*
   * ============================================================
   * ÍCONES
   * ============================================================
   */

  function icon(name) {
    const paths = {
      home:
        '<path d="M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5h-5.8v-6.3H9.3V21H3.5a.5.5 0 0 1-.5-.5z"/>',

      feed:
        '<path d="M4 5h16M4 12h16M4 19h10"/>',

      movie:
        '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="m7 5 3 4 3-4 3 4 3-4"/>',

      list:
        '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',

      friends:
        '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',

      info:
        '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',

      user:
        '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',

      search:
        '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',

      plus:
        '<path d="M12 5v14M5 12h14"/>',

      eye:
        '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',

      heart:
        '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',

      bookmark:
        '<path d="M6 3h12v18l-6-4-6 4z"/>',

      pen:
        '<path d="m4 20 4.2-1 10.7-10.7a2 2 0 0 0-2.8-2.8L5.4 16.2z"/><path d="m14.8 6.8 2.8 2.8"/>',

      arrow:
        '<path d="M5 12h14M13 6l6 6-6 6"/>',

      close:
        '<path d="M6 6l12 12M18 6 6 18"/>',

      menu:
        '<path d="M4 6h16M4 12h16M4 18h16"/>',

      chevronLeft:
        '<path d="m15 18-6-6 6-6"/>',

      chevronRight:
        '<path d="m9 18 6-6-6-6"/>',

      check:
        '<path d="m5 12 4 4L19 6"/>',

      comment:
        '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>'
    };

    return `
      <svg
        class="icon"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        ${paths[name] || paths.info}
      </svg>
    `;
  }

  /*
   * ============================================================
   * ESTADO DOS FILMES
   * ============================================================
   *
   * Essa parte continua como estava.
   *
   * IMPORTANTE:
   * watched/loved/listed ainda estão locais.
   * Favoritos NÃO.
   */

  function movieStateFor(movie) {
    const key =
      movieKey(movie);

    const saved =
      state.movieState[key] || {};

    return {
      watched:
        Boolean(saved.watched),

      watchedAt:
        saved.watchedAt || 0,

      loved:
        Boolean(saved.loved),

      lovedAt:
        saved.lovedAt || 0,

      listed:
        Boolean(saved.listed),

      listedAt:
        saved.listedAt || 0
    };
  }

  function updateMovieState(
    movie,
    action
  ) {
    const key =
      movieKey(movie);

    const current =
      movieStateFor(movie);

    const nextValue =
      !current[action];

    const timestampField =
      `${action}At`;

    state.movieState[key] = {
      ...current,

      [action]:
        nextValue,

      [timestampField]:
        nextValue
          ? Date.now()
          : 0
    };

    writeJSON(
      KEYS.movieState,
      state.movieState
    );

    window.dispatchEvent(
      new CustomEvent(
        "cinecena:movie-state-updated",
        {
          detail: {
            movie,
            action
          }
        }
      )
    );

    return state.movieState[key];
  }

  /*
   * ============================================================
   * FAVORITOS - API
   * ============================================================
   */

  async function loadFavorites() {
    const token =
      localStorage.getItem("token");

    if (!token) {
      favoriteState.items = [];
      return [];
    }

    favoriteState.loading = true;

    try {
      const response =
        await fetch(
          FAVORITES_API_URL,
          {
            method: "GET",

            headers: {
              "Authorization":
                `Token ${token}`,

              "Content-Type":
                "application/json"
            }
          }
        );

      if (!response.ok) {
        throw new Error(
          `Erro ao carregar favoritos: ${response.status}`
        );
      }

      const data =
        await response.json();

      favoriteState.items =
        Array.isArray(data)
          ? data.sort(
              (a, b) =>
                Number(a.position) -
                Number(b.position)
            )
          : [];

      window.dispatchEvent(
        new CustomEvent(
          "cinecena:favorites-updated",
          {
            detail: {
              favorites:
                favoriteState.items
            }
          }
        )
      );

      return favoriteState.items;

    } catch (error) {
      console.error(
        "CineCena: erro ao carregar favoritos:",
        error
      );

      favoriteState.items = [];

      return [];

    } finally {
      favoriteState.loading = false;
    }
  }

  /*
   * Retorna os cinco slots.
   *
   * O índice da matriz é:
   *
   * 0 = posição 1
   * 1 = posição 2
   * 2 = posição 3
   * 3 = posição 4
   * 4 = posição 5
   */
  function favoriteSlots() {
    const slots =
      Array(FAVORITE_LIMIT).fill(null);

    favoriteState.items.forEach(
      favorite => {
        const position =
          Number(favorite.position);

        if (
          position < 1 ||
          position > FAVORITE_LIMIT
        ) {
          return;
        }

        /*
         * Primeiro tenta encontrar o filme
         * dentro do catálogo carregado.
         */
        const movie =
          state.movies.find(
            item =>
              Number(
                item?.tmdb_id ??
                item?.id
              ) ===
              Number(favorite.tmdb_id)
          );

        if (movie) {
          /*
           * Mantemos o objeto do filme do TMDB,
           * mas guardamos também informações
           * do registro FavoriteMovie.
           */
          slots[position - 1] = {
            ...movie,

            favoriteId:
              favorite.id,

            favoritePosition:
              favorite.position
          };

          return;
        }

        /*
         * Caso o filme não esteja no catálogo
         * atual, ainda conseguimos mostrar o
         * favorito usando os dados armazenados
         * no banco.
         */
        slots[position - 1] = {
          id: favorite.tmdb_id,

          tmdb_id: favorite.tmdb_id,

          title:
            favorite.title || "Filme",

          poster_path:
            favorite.poster_path || "",

          position:
            favorite.position,

          favoriteId:
            favorite.id,

          favoritePosition:
            favorite.position
        };
      }
    );

    return slots;
  }

  /*
   * Adiciona um favorito no banco.
   */
  async function addFavorite(
    movie,
    slotIndex = null
  ) {
    if (!movie) {
      return false;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      toast(
        "Você precisa estar logado."
      );

      return false;
    }

    const tmdbId =
      movie.tmdb_id ??
      movie.id;

    if (!tmdbId) {
      toast(
        "Não foi possível identificar o filme."
      );

      return false;
    }

    /*
     * Verifica se esse TMDB ID já pertence
     * aos favoritos desta conta.
     */
    const existing =
      favoriteState.items.find(
        favorite =>
          Number(favorite.tmdb_id) ===
          Number(tmdbId)
      );

    if (existing) {
      toast(
        "Esse filme já está nos favoritos."
      );

      return false;
    }

    /*
     * Determina a posição.
     */
    let position = null;

    /*
     * Se o usuário clicou em uma vaga
     * específica, usa essa vaga.
     */
    if (
      Number.isInteger(slotIndex)
    ) {
      position =
        slotIndex + 1;
    } else {
      /*
       * Caso contrário, encontra a primeira vaga livre.
       */
      const occupied =
        favoriteState.items.map(
          favorite =>
            Number(
              favorite.position
            )
        );

      position =
        [1, 2, 3, 4, 5].find(
          value =>
            !occupied.includes(value)
        ) || null;
    }

    if (!position) {
      toast(
        "Você já possui cinco filmes favoritos."
      );

      return false;
    }

    /*
     * Segurança extra no frontend:
     * uma posição já ocupada não pode ser sobrescrita.
     */
    const positionOccupied =
      favoriteState.items.some(
        favorite =>
          Number(
            favorite.position
          ) === position
      );

    if (positionOccupied) {
      toast(
        "Esta vaga já está ocupada."
      );

      return false;
    }

    try {
      const response =
        await fetch(
          FAVORITES_API_URL,
          {
            method: "POST",

            headers: {
              "Authorization":
                `Token ${token}`,

              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                tmdb_id:
                  Number(tmdbId),

                title:
                  movie.title ??
                  movie.name ??
                  "",

                poster_path:
                  movie.poster_path ??
                  "",

                position
              })
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        console.error(
          "CineCena API favoritos:",
          data
        );

        let message =
          "Não foi possível adicionar o favorito.";

        if (data?.detail) {
          message =
            data.detail;
        } else if (
          data?.position?.[0]
        ) {
          message =
            data.position[0];
        } else if (
          data?.tmdb_id?.[0]
        ) {
          message =
            data.tmdb_id[0];
        }

        throw new Error(message);
      }

      /*
       * Atualiza apenas a memória da página.
       *
       * NÃO salva no localStorage.
       */
      favoriteState.items.push(
        data
      );

      favoriteState.items.sort(
        (a, b) =>
          Number(a.position) -
          Number(b.position)
      );

      window.dispatchEvent(
        new CustomEvent(
          "cinecena:favorites-updated",
          {
            detail: {
              favorite: data
            }
          }
        )
      );

      toast(
        "Filme adicionado aos favoritos."
      );

      return true;

    } catch (error) {
      console.error(
        "CineCena: erro ao adicionar favorito:",
        error
      );

      toast(
        error.message ||
        "Erro ao adicionar favorito."
      );

      return false;
    }
  }

  /*
   * Remove um favorito pelo slot.
   */
  async function removeFavoriteAt(
    slotIndex
  ) {
    const index =
      Number(slotIndex);

    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= FAVORITE_LIMIT
    ) {
      return false;
    }

    /*
     * A posição no banco começa em 1.
     */
    const position =
      index + 1;

    const favorite =
      favoriteState.items.find(
        item =>
          Number(
            item.position
          ) === position
      );

    if (!favorite) {
      return false;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      toast(
        "Você precisa estar logado."
      );

      return false;
    }

    /*
     * O ID usado aqui é o ID do registro
     * FavoriteMovie no banco.
     */
    if (!favorite.id) {
      console.error(
        "Favorito sem ID do banco:",
        favorite
      );

      toast(
        "Não foi possível identificar o favorito."
      );

      return false;
    }

    try {
      const response =
        await fetch(
          `${FAVORITES_API_URL}${favorite.id}/`,
          {
            method: "DELETE",

            headers: {
              "Authorization":
                `Token ${token}`,

              "Content-Type":
                "application/json"
            }
          }
        );

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          data?.detail ||
          "Não foi possível remover o favorito."
        );
      }

      /*
       * Remove somente da memória.
       */
      favoriteState.items =
        favoriteState.items.filter(
          item =>
            item.id !== favorite.id
        );

      window.dispatchEvent(
        new CustomEvent(
          "cinecena:favorites-updated",
          {
            detail: {
              removed:
                favorite
            }
          }
        )
      );

      toast(
        "Filme removido dos favoritos."
      );

      return true;

    } catch (error) {
      console.error(
        "CineCena: erro ao remover favorito:",
        error
      );

      toast(
        error.message ||
        "Erro ao remover favorito."
      );

      return false;
    }
  }

  /*
   * Remove um filme usando o tmdb_id.
   */
  async function removeFavorite(
    movie
  ) {
    if (!movie) {
      return false;
    }

    const tmdbId =
      movie.tmdb_id ??
      movie.id;

    const favorite =
      favoriteState.items.find(
        item =>
          Number(item.tmdb_id) ===
          Number(tmdbId)
      );

    if (!favorite) {
      return false;
    }

    const index =
      Number(favorite.position) - 1;

    return removeFavoriteAt(
      index
    );
  }

  /*
   * ============================================================
   * COLEÇÕES
   * ============================================================
   */

  function collectionMovies(type) {
    /*
     * Favoritos vêm da API.
     */
    if (
      type === "favorites"
    ) {
      return favoriteSlots()
        .filter(Boolean);
    }

    const field =
      type === "loved"
        ? "loved"
        : type === "watched"
          ? "watched"
          : "listed";

    const atField =
      `${field}At`;

    return state.movies
      .filter(
        movie =>
          movieStateFor(
            movie
          )[field]
      )
      .sort(
        (a, b) =>
          movieStateFor(
            b
          )[atField] -
          movieStateFor(
            a
          )[atField]
      );
  }

  /*
   * ============================================================
   * MODAIS
   * ============================================================
   */

  function mountModal(
    id,
    content,
    size = "md"
  ) {
    const portal =
      document.getElementById(
        "portal"
      ) || document.body;

    const node =
      document.createElement(
        "div"
      );

    node.className =
      "modal-backdrop";

    node.dataset.modal =
      id;

    node.innerHTML = `
      <div
        class="app-modal ${size}"
        role="dialog"
        aria-modal="true"
      >
        <button
          class="modal-close"
          type="button"
          data-close-modal
          aria-label="Fechar"
        >
          ${icon("close")}
        </button>

        ${content}
      </div>
    `;

    portal.appendChild(
      node
    );

    document.body.classList.add(
      "modal-open"
    );

    node
      .querySelector(
        "[data-close-modal]"
      )
      ?.addEventListener(
        "click",
        () => closeModal(node)
      );

    node.addEventListener(
      "click",
      event => {
        if (
          event.target === node
        ) {
          closeModal(node);
        }
      }
    );

    return node;
  }

  function closeModal(node) {
    node?.remove();

    if (
      !document.querySelector(
        ".modal-backdrop"
      )
    ) {
      document.body.classList.remove(
        "modal-open"
      );
    }
  }

  /*
   * ============================================================
   * TOAST
   * ============================================================
   */

  function toast(message) {
    document
      .querySelector(
        ".app-toast"
      )
      ?.remove();

    const node =
      document.createElement(
        "div"
      );

    node.className =
      "app-toast";

    node.innerHTML = `
      ${icon("check")}
      <span>
        ${escapeHTML(message)}
      </span>
    `;

    document.body.appendChild(
      node
    );

    setTimeout(
      () => node.remove(),
      2500
    );
  }

  /*
   * ============================================================
   * PERFIL
   * ============================================================
   */

  function refreshProfileShortcut() {
    document
      .querySelectorAll(
        "[data-own-avatar]"
      )
      .forEach(
        node => {
          node.textContent =
            initials(
              state.profile.name
            );
        }
      );

    document
      .querySelectorAll(
        "[data-own-name]"
      )
      .forEach(
        node => {
          node.textContent =
            state.profile.name;
        }
      );
  }

  function setFriend(value) {
    state.friend =
      Boolean(value);

    localStorage.setItem(
      KEYS.friend,
      String(
        state.friend
      )
    );

    window.dispatchEvent(
      new CustomEvent(
        "cinecena:friend-updated"
      )
    );
  }

  function saveProfile(profile) {
    state.profile =
      profile;

    writeJSON(
      KEYS.profile,
      profile
    );

    refreshProfileShortcut();

    window.dispatchEvent(
      new CustomEvent(
        "cinecena:profile-updated"
      )
    );
  }

  /*
   * ============================================================
   * POSTS
   * ============================================================
   *
   * Esta parte ainda utiliza localStorage,
   * conforme a estrutura atual do seu projeto.
   *
   * Os favoritos NÃO passam por aqui.
   */

  function savePost(post) {
    state.posts.unshift(
      post
    );

    writeJSON(
      KEYS.posts,
      state.posts
    );

    window.dispatchEvent(
      new CustomEvent(
        "cinecena:social-updated"
      )
    );
  }

  /*
   * ============================================================
   * REVIEWS
   * ============================================================
   */

  function saveReview(review) {
    state.reviews.unshift({
      ...review,

      createdAt:
        review.createdAt ||
        Date.now()
    });

    writeJSON(
      KEYS.reviews,
      state.reviews
    );

    window.dispatchEvent(
      new CustomEvent(
        "cinecena:social-updated"
      )
    );
  }

  /*
   * ============================================================
   * TMDB
   * ============================================================
   */

  async function hydrateFromTMDB() {
    if (
      !TMDB.isConfigured() ||
      state.loadingMovies
    ) {
      return;
    }

    state.loadingMovies =
      true;

    try {
      const [
        movies,
        person
      ] =
        await Promise.all([
          TMDB.hydrateCuratedMovies(
            Data.curatedMovies
          ),

          TMDB.searchPerson(
            "Glauber Rocha"
          ).catch(
            () => null
          )
        ]);

      if (
        movies.length
      ) {
        state.movies =
          movies;
      }

      if (
        person?.profile_path
      ) {
        state.glauberPhoto =
          TMDB.profileUrl(
            person.profile_path
          );
      }

      state.tmdbReady =
        true;

      window.dispatchEvent(
        new CustomEvent(
          "cinecena:movies-updated"
        )
      );

    } catch (error) {
      console.warn(
        "CineCena: TMDB indisponível. Mantendo dados demonstrativos.",
        error
      );

      state.tmdbReady =
        false;

      window.dispatchEvent(
        new CustomEvent(
          "cinecena:movies-updated"
        )
      );

    } finally {
      state.loadingMovies =
        false;
    }
  }

  /*
   * ============================================================
   * NAVEGAÇÃO
   * ============================================================
   */

  function initNavigation() {
    refreshProfileShortcut();

    const toggle =
      document.querySelector(
        "[data-mobile-menu]"
      );

    const panel =
      document.querySelector(
        "[data-mobile-panel]"
      );

    toggle?.addEventListener(
      "click",
      () =>
        panel?.classList.toggle(
          "open"
        )
    );
  }

  /*
   * ============================================================
   * API PÚBLICA
   * ============================================================
   */

  window.CineCena = {
    Data,
    TMDB,
    KEYS,

    state,

    readJSON,
    writeJSON,

    escapeHTML,
    movieYear,
    posterURL,
    initials,
    movieKey,
    findMovie,
    genresText,
    icon,

    movieStateFor,
    updateMovieState,

    collectionMovies,

    /*
     * FAVORITOS
     */
    favoriteSlots,
    addFavorite,
    removeFavorite,
    removeFavoriteAt,
    loadFavorites,

    mountModal,
    closeModal,

    toast,

    setFriend,
    saveProfile,
    savePost,
    saveReview,

    hydrateFromTMDB
  };

  /*
   * ============================================================
   * INICIALIZAÇÃO
   * ============================================================
   */

  initNavigation();

  if (
    !["about", "terms"].includes(
      document.body.dataset.page
    )
  ) {
    /*
     * Carrega filmes do TMDB.
     */
    hydrateFromTMDB();

    /*
     * Carrega favoritos do Django/Supabase.
     */
    loadFavorites();
  }

})();


/*
 * ============================================================
 * AUTENTICAÇÃO / USUÁRIO ATUAL
 * ============================================================
 *
 * IMPORTANTE:
 * O localStorage abaixo NÃO guarda favoritos.
 *
 * Ele guarda apenas:
 * - token
 * - usuário atual
 *
 * Isso é necessário para autenticar as requisições
 * feitas ao Django.
 * ============================================================
 */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    const token =
      localStorage.getItem(
        "token"
      );

    const storedUser =
      localStorage.getItem(
        "user"
      );

    /*
     * Usuário não autenticado.
     */
    if (!token) {
      window.location.href =
        "../index.html";

      return;
    }

    let user =
      storedUser
        ? JSON.parse(
            storedUser
          )
        : null;

    /*
     * Busca os dados atualizados do usuário.
     */
    try {

      const response =
        await fetch(
          "http://127.0.0.1:8000/api/accounts/me/",
          {
            headers: {
              "Authorization":
                `Token ${token}`,

              "Content-Type":
                "application/json"
            }
          }
        );

      if (response.ok) {

        user =
          await response.json();

        /*
         * Atualiza apenas os dados do usuário.
         */
        localStorage.setItem(
          "user",
          JSON.stringify(
            user
          )
        );

      } else if (
        response.status === 401
      ) {

        /*
         * Token inválido.
         *
         * Aqui o localStorage é limpo porque
         * a sessão inteira está inválida.
         *
         * NÃO temos favoritos armazenados aqui.
         */
        localStorage.clear();

        window.location.href =
          "../index.html";

        return;
      }

    } catch (err) {

      console.warn(
        "Backend off-line ou erro na requisição. Usando dados locais.",
        err
      );
    }

    /*
     * Atualização visual do usuário.
     */
    if (
      user &&
      user.username
    ) {

      const username =
        user.username;

      const initials =
        username
          .substring(0, 2)
          .toUpperCase();

      /*
       * Avatar
       */
      document
        .querySelectorAll(
          "[data-own-avatar], [data-feed-own-avatar], [data-profile-avatar]"
        )
        .forEach(
          element => {

            if (user.avatar) {

              element.innerHTML = `
                <img
                  src="${user.avatar}"
                  alt="${username}"
                  style="
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                  "
                >
              `;

            } else {

              element.textContent =
                initials;
            }
          }
        );

      /*
       * Handle
       */
      document
        .querySelectorAll(
          "[data-own-name]"
        )
        .forEach(
          element => {
            element.textContent =
              `@${username}`;
          }
        );

      /*
       * Nome principal do perfil
       */
      document
        .querySelectorAll(
          "[data-own-title], [data-profile-name]"
        )
        .forEach(
          element => {
            element.textContent =
              username;
          }
        );
    }
  }
);