(() => {
  const Data = window.CineCenaData;
  const TMDB = window.CineCenaTMDB;

  /*
   * CONFIGURAÇÃO DA API DE FAVORITOS
   */
  const FAVORITES_API_URL = window.CINECENA_API ? window.CINECENA_API.endpoint("movies/favorites/") : "https://cinecena.onrender.com/api/movies/favorites/";
  
  const FAVORITE_LIMIT = 5;

  /*
   * ESTADO DOS FAVORITOS (Mantido na memória da página)
   */
  const favoriteState = {
    items: [],
    loading: false
  };

  const KEYS = {
    friend: "cinecena.friend.glauber",
    profile: "cinecena.profile",
    reviews: "cinecena.reviews",
    posts: "cinecena.posts",
    movieState: "cinecena.movie-state"
  };

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  const state = {
    movies: Data?.curatedMovies || [],
    tmdbReady: TMDB ? TMDB.isConfigured() : false,
    loadingMovies: false,
    glauberPhoto: "",
    friend: localStorage.getItem(KEYS.friend) === "true",
    profile: readJSON(KEYS.profile, {
      name: "Usuário CineCena",
      description: "Apaixonado por cinema brasileiro."
    }),
    reviews: readJSON(KEYS.reviews, []),
    posts: readJSON(KEYS.posts, []),
    movieState: readJSON(KEYS.movieState, {})
  };

  /*
   * UTILITÁRIOS
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
    return movie?.year || (movie?.release_date ? String(movie.release_date).slice(0, 4) : "—");
  }

  function posterURL(movie) {
    return movie?.poster || (TMDB ? TMDB.posterUrl(movie?.poster_path || "") : "");
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
    return String(movie?.catalogKey ?? movie?.tmdb_id ?? movie?.id ?? movie?.title ?? "");
  }

  function findMovie(keyOrTitle) {
    const wanted = String(keyOrTitle ?? "");
    return state.movies.find(
      movie =>
        movieKey(movie) === wanted ||
        String(movie?.tmdb_id ?? "") === wanted ||
        String(movie?.id ?? "") === wanted ||
        movie.title === wanted
    );
  }

  function genresText(movie, max = 2) {
    const genres = Array.isArray(movie?.genres)
      ? movie.genres.map(genre => (typeof genre === "string" ? genre : genre?.name)).filter(Boolean)
      : [];

    return genres.slice(0, max).join(" · ") || "Cinema brasileiro";
  }

  function icon(name) {
    const paths = {
      home: '<path d="M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5h-5.8v-6.3H9.3V21H3.5a.5.5 0 0 1-.5-.5z"/>',
      feed: '<path d="M4 5h16M4 12h16M4 19h10"/>',
      movie: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="m7 5 3 4 3-4 3 4 3-4"/>',
      list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
      friends: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 1-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
      user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
      heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
      bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
      pen: '<path d="m4 20 4.2-1 10.7-10.7a2 2 0 0 0-2.8-2.8L5.4 16.2z"/><path d="m14.8 6.8 2.8 2.8"/>',
      arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
      close: '<path d="M6 6l12 12M18 6 6 18"/>',
      menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
      chevronLeft: '<path d="m15 18-6-6 6-6"/>',
      chevronRight: '<path d="m9 18 6-6-6-6"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      comment: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>'
    };

    return `
      <svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        ${paths[name] || paths.info}
      </svg>
    `;
  }

  function movieStateFor(movie) {
    const key = movieKey(movie);
    const saved = state.movieState[key] || {};

    return {
      watched: Boolean(saved.watched),
      watchedAt: saved.watchedAt || 0,
      loved: Boolean(saved.loved),
      lovedAt: saved.lovedAt || 0,
      listed: Boolean(saved.listed),
      listedAt: saved.listedAt || 0
    };
  }

  function updateMovieState(movie, action) {
    const key = movieKey(movie);
    const current = movieStateFor(movie);
    const nextValue = !current[action];
    const timestampField = `${action}At`;

    state.movieState[key] = {
      ...current,
      [action]: nextValue,
      [timestampField]: nextValue ? Date.now() : 0
    };

    writeJSON(KEYS.movieState, state.movieState);

    window.dispatchEvent(
      new CustomEvent("cinecena:movie-state-updated", {
        detail: { movie, action }
      })
    );

    return state.movieState[key];
  }

  /*
   * FAVORITOS - CARREGAR
   */
  async function loadFavorites() {
    const token = localStorage.getItem("token");

    if (!token) {
      favoriteState.items = [];
      return [];
    }

    favoriteState.loading = true;

    try {
      const response = await fetch(FAVORITES_API_URL, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao carregar favoritos: ${response.status}`);
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.results || []);

      favoriteState.items = list.sort((a, b) => Number(a.position) - Number(b.position));

      window.dispatchEvent(
        new CustomEvent("cinecena:favorites-updated", {
          detail: { favorites: favoriteState.items }
        })
      );

      return favoriteState.items;
    } catch (error) {
      console.error("CineCena: erro ao carregar favoritos:", error);
      favoriteState.items = [];
      return [];
    } finally {
      favoriteState.loading = false;
    }
  }

  function favoriteSlots() {
    const slots = Array(FAVORITE_LIMIT).fill(null);

    favoriteState.items.forEach(favorite => {
      const position = Number(favorite.position);

      if (position < 1 || position > FAVORITE_LIMIT) return;

      const movie = state.movies.find(
        item => Number(item?.tmdb_id ?? item?.id) === Number(favorite.tmdb_id)
      );

      if (movie) {
        slots[position - 1] = {
          ...movie,
          favoriteId: favorite.id,
          favoritePosition: favorite.position
        };
        return;
      }

      slots[position - 1] = {
        id: favorite.tmdb_id,
        tmdb_id: favorite.tmdb_id,
        title: favorite.title || "Filme",
        poster_path: favorite.poster_path || "",
        position: favorite.position,
        favoriteId: favorite.id,
        favoritePosition: favorite.position
      };
    });

    return slots;
  }

  /*
   * FAVORITOS - ADICIONAR / ATUALIZAR (PREVINE ERRO 400)
   */
  async function addFavorite(movie, slotIndex = null) {
    if (!movie) return false;

    const token = localStorage.getItem("token");
    if (!token) {
      toast("Você precisa estar logado.");
      return false;
    }

    const tmdbId = movie.tmdb_id ?? movie.id;
    if (!tmdbId) {
      toast("Não foi possível identificar o filme.");
      return false;
    }

    let position = Number.isInteger(slotIndex) ? slotIndex + 1 : null;

    if (!position) {
      const occupied = favoriteState.items.map(f => Number(f.position));
      position = [1, 2, 3, 4, 5].find(val => !occupied.includes(val)) || null;
    }

    if (!position) {
      toast("Você já possui cinco filmes favoritos.");
      return false;
    }

    // Verifica se a vaga já tem um filme
    const existingInSlot = favoriteState.items.find(
      f => Number(f.position) === Number(position)
    );

    // Se a vaga estiver ocupada, faz PUT para substituir o registo existente
    const isUpdate = Boolean(existingInSlot && existingInSlot.id);
    const method = isUpdate ? "PUT" : "POST";
    const targetUrl = isUpdate ? `${FAVORITES_API_URL}${existingInSlot.id}/` : FAVORITES_API_URL;

    try {
      const response = await fetch(targetUrl, {
        method: method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tmdb_id: Number(tmdbId),
          title: movie.title ?? movie.name ?? "",
          poster_path: movie.poster_path ?? movie.poster_url ?? "",
          position: Number(position)
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        let message = "Não foi possível salvar o favorito.";
        if (data?.detail) message = data.detail;
        throw new Error(message);
      }

      if (isUpdate) {
        favoriteState.items = favoriteState.items.map(item =>
          item.id === existingInSlot.id ? data : item
        );
      } else {
        favoriteState.items.push(data);
      }

      favoriteState.items.sort((a, b) => Number(a.position) - Number(b.position));

      window.dispatchEvent(
        new CustomEvent("cinecena:favorites-updated", {
          detail: { favorites: favoriteState.items }
        })
      );

      toast("Vaga de favorito atualizada com sucesso!");
      return true;

    } catch (error) {
      console.error("CineCena: erro ao adicionar favorito:", error);
      toast(error.message || "Erro ao adicionar favorito.");
      return false;
    }
  }

  /*
   * FAVORITOS - REMOVER
   */
  async function removeFavoriteAt(slotIndex) {
    const index = Number(slotIndex);

    if (!Number.isInteger(index) || index < 0 || index >= FAVORITE_LIMIT) {
      return false;
    }

    const position = index + 1;
    const favorite = favoriteState.items.find(item => Number(item.position) === position);

    if (!favorite || !favorite.id) return false;

    const token = localStorage.getItem("token");
    if (!token) {
      toast("Você precisa estar logado.");
      return false;
    }

    try {
      const response = await fetch(`${FAVORITES_API_URL}${favorite.id}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || "Não foi possível remover o favorito.");
      }

      favoriteState.items = favoriteState.items.filter(item => item.id !== favorite.id);

      window.dispatchEvent(
        new CustomEvent("cinecena:favorites-updated", {
          detail: { removed: favorite }
        })
      );

      toast("Filme removido dos favoritos.");
      return true;

    } catch (error) {
      console.error("CineCena: erro ao remover favorito:", error);
      toast(error.message || "Erro ao remover favorito.");
      return false;
    }
  }

  async function removeFavorite(movie) {
    if (!movie) return false;

    const tmdbId = movie.tmdb_id ?? movie.id;
    const favorite = favoriteState.items.find(item => Number(item.tmdb_id) === Number(tmdbId));

    if (!favorite) return false;

    const index = Number(favorite.position) - 1;
    return removeFavoriteAt(index);
  }

  function collectionMovies(type) {
    if (type === "favorites") {
      return favoriteSlots().filter(Boolean);
    }

    const field = type === "loved" ? "loved" : type === "watched" ? "watched" : "listed";
    const atField = `${field}At`;

    return state.movies
      .filter(movie => movieStateFor(movie)[field])
      .sort((a, b) => movieStateFor(b)[atField] - movieStateFor(a)[atField]);
  }

  /*
   * MODAIS E TOAST
   */
  function mountModal(id, content, size = "md") {
    const portal = document.getElementById("portal") || document.body;
    const node = document.createElement("div");

    node.className = "modal-backdrop";
    node.dataset.modal = id;
    node.innerHTML = `
      <div class="app-modal ${size}" role="dialog" aria-modal="true">
        <button class="modal-close" type="button" data-close-modal aria-label="Fechar">
          ${icon("close")}
        </button>
        ${content}
      </div>
    `;

    portal.appendChild(node);
    document.body.classList.add("modal-open");

    node.querySelector("[data-close-modal]")?.addEventListener("click", () => closeModal(node));
    node.addEventListener("click", event => {
      if (event.target === node) closeModal(node);
    });

    return node;
  }

  function closeModal(node) {
    node?.remove();
    if (!document.querySelector(".modal-backdrop")) {
      document.body.classList.remove("modal-open");
    }
  }

  function toast(message) {
    document.querySelector(".app-toast")?.remove();

    const node = document.createElement("div");
    node.className = "app-toast";
    node.innerHTML = `
      ${icon("check")}
      <span>${escapeHTML(message)}</span>
    `;

    document.body.appendChild(node);
    setTimeout(() => node.remove(), 2500);
  }

  /*
   * PERFIL E AUXILIARES
   */
  function refreshProfileShortcut() {
    document.querySelectorAll("[data-own-avatar]").forEach(node => {
      node.textContent = initials(state.profile.name);
    });

    document.querySelectorAll("[data-own-name]").forEach(node => {
      node.textContent = state.profile.name;
    });
  }

  function setFriend(value) {
    state.friend = Boolean(value);
    localStorage.setItem(KEYS.friend, String(state.friend));
    window.dispatchEvent(new CustomEvent("cinecena:friend-updated"));
  }

  function saveProfile(profile) {
    state.profile = profile;
    writeJSON(KEYS.profile, profile);
    refreshProfileShortcut();
    window.dispatchEvent(new CustomEvent("cinecena:profile-updated"));
  }

  function savePost(post) {
    state.posts.unshift(post);
    writeJSON(KEYS.posts, state.posts);
    window.dispatchEvent(new CustomEvent("cinecena:social-updated"));
  }

  function saveReview(review) {
    state.reviews.unshift({
      ...review,
      createdAt: review.createdAt || Date.now()
    });

    writeJSON(KEYS.reviews, state.reviews);
    window.dispatchEvent(new CustomEvent("cinecena:social-updated"));
  }

  async function hydrateFromTMDB() {
    if (!TMDB || !TMDB.isConfigured() || state.loadingMovies) return;

    state.loadingMovies = true;

    try {
      const [movies, person] = await Promise.all([
        TMDB.hydrateCuratedMovies(Data.curatedMovies),
        TMDB.searchPerson("Glauber Rocha").catch(() => null)
      ]);

      if (movies.length) state.movies = movies;
      if (person?.profile_path) state.glauberPhoto = TMDB.profileUrl(person.profile_path);

      state.tmdbReady = true;
      window.dispatchEvent(new CustomEvent("cinecena:movies-updated"));

    } catch (error) {
      console.warn("CineCena: TMDB indisponível.", error);
      state.tmdbReady = false;
      window.dispatchEvent(new CustomEvent("cinecena:movies-updated"));
    } finally {
      state.loadingMovies = false;
    }
  }

  function initNavigation() {
    refreshProfileShortcut();
    const toggle = document.querySelector("[data-mobile-menu]");
    const panel = document.querySelector("[data-mobile-panel]");

    toggle?.addEventListener("click", () => panel?.classList.toggle("open"));
  }

  /*
   * API PÚBLICA DO CINECENA
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
   * INICIALIZAÇÃO
   */
  initNavigation();

  if (!["about", "terms"].includes(document.body.dataset.page)) {
    hydrateFromTMDB();
    loadFavorites();
  }

})();

/*
 * AUTENTICAÇÃO E VERIFICAÇÃO DO USUÁRIO ATUAL
 */
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!token) {
    window.location.href = "../index.html";
    return;
  }

  let user = storedUser ? JSON.parse(storedUser) : null;

  try {
    const endpoint = window.CINECENA_API ? window.CINECENA_API.endpoint("accounts/me/") : "https://cinecena.onrender.com/api/accounts/me/";
    const response = await fetch(endpoint, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      user = await response.json();
      localStorage.setItem("user", JSON.stringify(user));
    } else if (response.status === 401) {
      localStorage.clear();
      window.location.href = "../index.html";
      return;
    }
  } catch (err) {
    console.warn("Backend indisponível. Usando dados em cache.", err);
  }

  if (user && user.username) {
    const username = user.username;
    const initials = username.substring(0, 2).toUpperCase();

    document.querySelectorAll("[data-own-avatar], [data-feed-own-avatar], [data-profile-avatar]").forEach(element => {
      if (user.avatar) {
        element.innerHTML = `<img src="${user.avatar}" alt="${username}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
      } else {
        element.textContent = initials;
      }
    });

    document.querySelectorAll("[data-own-name]").forEach(element => {
      element.textContent = `@${username}`;
    });

    document.querySelectorAll("[data-own-title], [data-profile-name]").forEach(element => {
      element.textContent = username;
    });
  }
});