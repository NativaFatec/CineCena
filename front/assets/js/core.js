(() => {
  const Data = window.CineCenaData;
  const TMDB = window.CineCenaTMDB;

  const KEYS = {
    friend: "cinecena.friend.glauber",
    profile: "cinecena.profile",
    reviews: "cinecena.reviews",
    posts: "cinecena.posts",
    movieState: "cinecena.movie-state",
    favorites: "cinecena.favorites"
  };
  const FAVORITE_LIMIT = 5;

  function readJSON(key, fallback) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      return parsed ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeFavoriteSlots(items) {
    const slots = Array(FAVORITE_LIMIT).fill(null);
    if (!Array.isArray(items)) return slots;
    items.slice(0, FAVORITE_LIMIT).forEach((item, index) => {
      if (item?.key || item?.title) slots[index] = item;
    });
    return slots;
  }

  const state = {
    movies: Data.curatedMovies,
    tmdbReady: TMDB.isConfigured(),
    loadingMovies: false,
    glauberPhoto: "",
    friend: localStorage.getItem(KEYS.friend) === "true",
    profile: readJSON(KEYS.profile, {
      name: "Usuário CineCena",
      description: "Apaixonado por cinema brasileiro."
    }),
    reviews: readJSON(KEYS.reviews, []),
    posts: readJSON(KEYS.posts, []),
    movieState: readJSON(KEYS.movieState, {}),
    favorites: normalizeFavoriteSlots(readJSON(KEYS.favorites, []))
  };

  function escapeHTML(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function movieYear(movie) {
    return movie?.year || (movie?.release_date ? movie.release_date.slice(0, 4) : "—");
  }

  function posterURL(movie) {
    return movie?.poster || TMDB.posterUrl(movie?.poster_path || "");
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
    return String(movie?.catalogKey ?? movie?.id ?? movie?.title ?? "");
  }

  function findMovie(keyOrTitle) {
    const wanted = String(keyOrTitle ?? "");
    return state.movies.find(movie => movieKey(movie) === wanted || movie.title === wanted);
  }

  function genresText(movie, max = 2) {
    const genres = Array.isArray(movie?.genres)
      ? movie.genres.map(genre => typeof genre === "string" ? genre : genre.name).filter(Boolean)
      : [];
    return genres.slice(0, max).join(" · ") || "Cinema brasileiro";
  }

  function icon(name) {
    const paths = {
      home: '<path d="M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5h-5.8v-6.3H9.3V21H3.5a.5.5 0 0 1-.5-.5z"/>',
      feed: '<path d="M4 5h16M4 12h16M4 19h10"/>',
      movie: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="m7 5 3 4 3-4 3 4 3-4"/>',
      list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
      friends: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
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
    return `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.info}</svg>`;
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
    window.dispatchEvent(new CustomEvent("cinecena:movie-state-updated", { detail: { movie, action } }));
    return state.movieState[key];
  }

  function favoriteSlots() {
    return state.favorites.map(item => item ? findMovie(item.key) || findMovie(item.title) || null : null);
  }

  function collectionMovies(type) {
    if (type === "favorites") return favoriteSlots().filter(Boolean);

    const field = type === "loved" ? "loved" : type === "watched" ? "watched" : "listed";
    const atField = `${field}At`;
    return state.movies
      .filter(movie => movieStateFor(movie)[field])
      .sort((a, b) => movieStateFor(b)[atField] - movieStateFor(a)[atField]);
  }

  function addFavorite(movie, slotIndex = null) {
    if (!movie) return false;
    const key = movieKey(movie);
    const duplicate = state.favorites.findIndex(item => item && (item.key === key || item.title === movie.title));
    if (duplicate !== -1) return false;

    const target = Number.isInteger(slotIndex) ? slotIndex : state.favorites.findIndex(item => !item);
    if (target < 0 || target >= FAVORITE_LIMIT || state.favorites[target]) return false;

    state.favorites[target] = { key, title: movie.title, addedAt: Date.now() };
    writeJSON(KEYS.favorites, state.favorites);
    window.dispatchEvent(new CustomEvent("cinecena:favorites-updated"));
    return true;
  }

  function removeFavoriteAt(slotIndex) {
    const target = Number(slotIndex);
    if (!Number.isInteger(target) || target < 0 || target >= FAVORITE_LIMIT) return;
    state.favorites[target] = null;
    writeJSON(KEYS.favorites, state.favorites);
    window.dispatchEvent(new CustomEvent("cinecena:favorites-updated"));
  }

  function removeFavorite(movie) {
    if (!movie) return;
    const key = movieKey(movie);
    const index = state.favorites.findIndex(item => item && (item.key === key || item.title === movie.title));
    if (index !== -1) removeFavoriteAt(index);
  }

  function mountModal(id, content, size = "md") {
    const portal = document.getElementById("portal") || document.body;
    const node = document.createElement("div");
    node.className = "modal-backdrop";
    node.dataset.modal = id;
    node.innerHTML = `<div class="app-modal ${size}" role="dialog" aria-modal="true"><button class="modal-close" type="button" data-close-modal aria-label="Fechar">${icon("close")}</button>${content}</div>`;
    portal.appendChild(node);
    document.body.classList.add("modal-open");
    node.querySelector("[data-close-modal]")?.addEventListener("click", () => closeModal(node));
    node.addEventListener("click", event => { if (event.target === node) closeModal(node); });
    return node;
  }

  function closeModal(node) {
    node?.remove();
    if (!document.querySelector(".modal-backdrop")) document.body.classList.remove("modal-open");
  }

  function toast(message) {
    document.querySelector(".app-toast")?.remove();
    const node = document.createElement("div");
    node.className = "app-toast";
    node.innerHTML = `${icon("check")}<span>${escapeHTML(message)}</span>`;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 2500);
  }

  function refreshProfileShortcut() {
    document.querySelectorAll("[data-own-avatar]").forEach(node => { node.textContent = initials(state.profile.name); });
    document.querySelectorAll("[data-own-name]").forEach(node => { node.textContent = state.profile.name; });
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
    state.reviews.unshift({ ...review, createdAt: review.createdAt || Date.now() });
    writeJSON(KEYS.reviews, state.reviews);
    window.dispatchEvent(new CustomEvent("cinecena:social-updated"));
  }

  async function hydrateFromTMDB() {
    if (!TMDB.isConfigured() || state.loadingMovies) return;
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
      console.warn("CineCena: TMDB indisponível. Mantendo dados demonstrativos.", error);
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
    mountModal,
    closeModal,
    toast,
    setFriend,
    saveProfile,
    savePost,
    saveReview,
    hydrateFromTMDB
  };

  initNavigation();
  if (!["about", "terms"].includes(document.body.dataset.page)) hydrateFromTMDB();
})();


// assets/js/core.js

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    // 1. Se o usuário tentar acessar qualquer página sem estar logado, volta para o index (login)
    if (!token) {
        window.location.href = '../index.html';
        return;
    }

    let user = storedUser ? JSON.parse(storedUser) : null;

    // 2. Tenta buscar os dados mais recentes do perfil no Django REST API
    try {
        const response = await fetch('http://127.0.0.1:8000/api/accounts/me/', {
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            user = await response.json();
            localStorage.setItem('user', JSON.stringify(user));
        } else if (response.status === 401) {
            // Se o token for inválido/expirado
            localStorage.clear();
            window.location.href = '../index.html';
            return;
        }
    } catch (err) {
        console.warn('Backend off-line ou erro na requisição. Usando dados locais.', err);
    }
if (user && user.username) {
        const username = user.username;
        const initials = username.substring(0, 2).toUpperCase();

        // Atualiza TODAS as iniciais da página (topo e avatar grande)
        document.querySelectorAll('[data-own-avatar], [data-feed-own-avatar]').forEach(el => {
            el.textContent = initials;
        });

        // Atualiza o handle (@usuario)
        document.querySelectorAll('[data-own-name]').forEach(el => {
            el.textContent = `@${username}`;
        });

        // Atualiza o título grande central do perfil
        document.querySelectorAll('[data-own-title]').forEach(el => {
            el.textContent = username;
        });
    }
});