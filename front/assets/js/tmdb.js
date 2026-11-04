window.CineCenaTMDB = (() => {
  const API_BASE = "https://api.themoviedb.org/3";
  const IMAGE_BASE = "https://image.tmdb.org/t/p";
  const CACHE_KEY = "cinecena.tmdb.catalog.v3";
  const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

  function token() {
    const value = window.CINECENA_CONFIG?.TMDB_TOKEN?.trim();
    if (!value || value === "COLE_SEU_API_READ_ACCESS_TOKEN_AQUI") return "";
    return value;
  }

  function isConfigured() {
    return Boolean(token());
  }

  async function request(path, params = {}) {
    if (!isConfigured()) throw new Error("TMDB_TOKEN_MISSING");

    const url = new URL(`${API_BASE}${path}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
    });

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token()}`
      }
    });

    if (!response.ok) throw new Error(`TMDB_HTTP_${response.status}`);
    return response.json();
  }

  function posterUrl(path, size = "w500") {
    return path ? `${IMAGE_BASE}/${size}${path}` : "";
  }

  function backdropUrl(path, size = "w1280") {
    return path ? `${IMAGE_BASE}/${size}${path}` : "";
  }

  function profileUrl(path, size = "w342") {
    return path ? `${IMAGE_BASE}/${size}${path}` : "";
  }

  function normalizeText(value = "") {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .trim()
      .toLowerCase();
  }

  function normalizeMovie(movie, genreMap = {}) {
    const genres = movie.genres?.map(genre => genre.name)
      || movie.genre_ids?.map(id => genreMap[id]).filter(Boolean)
      || [];

    return {
      ...movie,
      title: movie.title || movie.original_title || "Filme sem título",
      year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : null,
      genres,
      poster: posterUrl(movie.poster_path),
      backdrop: backdropUrl(movie.backdrop_path)
    };
  }

  async function getGenreMap() {
    const data = await request("/genre/movie/list", { language: "pt-BR" });
    return Object.fromEntries((data.genres || []).map(genre => [genre.id, genre.name]));
  }

  function chooseSearchResult(results, wanted) {
    if (!results?.length) return null;
    const wantedTitle = normalizeText(wanted.searchTitle || wanted.title);
    const wantedYear = Number(wanted.year);

    const scored = results.map(movie => {
      const title = normalizeText(movie.title);
      const original = normalizeText(movie.original_title);
      const year = Number((movie.release_date || "").slice(0, 4));
      let score = 0;

      if (title === wantedTitle || original === wantedTitle) score += 8;
      else if (title.includes(wantedTitle) || wantedTitle.includes(title)) score += 3;

      if (year === wantedYear) score += 6;
      else if (year && Math.abs(year - wantedYear) === 1) score += 2;

      if (movie.original_language === "pt") score += 1;
      if (movie.poster_path) score += 1;
      return { movie, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.movie || results[0];
  }

  async function searchCuratedMovie(movie, genreMap) {
    if (Number.isInteger(Number(movie.id)) && String(movie.id) === "598") {
      const data = await request(`/movie/${movie.id}`, { language: "pt-BR" });
      const normalized = normalizeMovie(data, genreMap);
      return { ...movie, ...normalized, genres: normalized.genres.length ? normalized.genres : movie.genres, mock: false };
    }

    let data = await request("/search/movie", {
      query: movie.searchTitle || movie.title,
      language: "pt-BR",
      include_adult: "false",
      year: movie.year
    });

    // Alguns filmes circulam em festivais em um ano e chegam comercialmente no seguinte.
    // Se o filtro de ano não encontrar nada, repetimos a busca apenas pelo título.
    if (!(data.results || []).length) {
      data = await request("/search/movie", {
        query: movie.searchTitle || movie.title,
        language: "pt-BR",
        include_adult: "false"
      });
    }

    const selected = chooseSearchResult(data.results || [], movie);
    if (!selected) return movie;

    const normalized = normalizeMovie(selected, genreMap);
    return {
      ...movie,
      ...normalized,
      title: movie.title,
      year: movie.year,
      genres: normalized.genres.length ? normalized.genres : movie.genres,
      tmdbTitle: normalized.title,
      mock: false
    };
  }

  function readCache(curated) {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (!cached?.savedAt || !Array.isArray(cached.movies)) return null;
      if (Date.now() - cached.savedAt > CACHE_MAX_AGE) return null;
      if (cached.movies.length !== curated.length) return null;
      return cached.movies;
    } catch (_) {
      return null;
    }
  }

  function writeCache(movies) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), movies }));
    } catch (_) {
      // localStorage pode estar indisponível; o catálogo continua funcionando sem cache.
    }
  }

  async function hydrateCuratedMovies(curated) {
    if (!isConfigured()) return curated;
    const cached = readCache(curated);
    if (cached) return cached;

    const genreMap = await getGenreMap().catch(() => ({}));
    const output = new Array(curated.length);
    let cursor = 0;
    const workers = Math.min(5, curated.length);

    async function worker() {
      while (cursor < curated.length) {
        const index = cursor;
        cursor += 1;
        const movie = curated[index];
        try {
          output[index] = await searchCuratedMovie(movie, genreMap);
        } catch (error) {
          console.warn(`CineCena: TMDB não encontrou ${movie.title}.`, error);
          output[index] = movie;
        }
      }
    }

    await Promise.all(Array.from({ length: workers }, () => worker()));
    writeCache(output);
    return output;
  }

  async function getMovieDetails(id) {
    if (!Number.isInteger(Number(id))) throw new Error("TMDB_ID_UNAVAILABLE");
    const data = await request(`/movie/${id}`, {
      language: "pt-BR",
      append_to_response: "credits,images",
      include_image_language: "pt-BR,pt,en,null"
    });
    return normalizeMovie(data);
  }

  async function searchMovies(query) {
    const data = await request("/search/movie", { query, language: "pt-BR", include_adult: "false" });
    return (data.results || []).map(movie => normalizeMovie(movie));
  }

  async function searchPerson(query) {
    const data = await request("/search/person", { query, language: "pt-BR", include_adult: "false" });
    return data.results?.[0] || null;
  }

  return {
    isConfigured,
    request,
    posterUrl,
    backdropUrl,
    profileUrl,
    hydrateCuratedMovies,
    getMovieDetails,
    searchMovies,
    searchPerson
  };
})();
