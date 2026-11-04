(() => {
  // Configure CINECENA_BACKEND_URL em config.js para desenvolvimento local.
  const baseUrl = String(window.CINECENA_BACKEND_URL || "https://cinecena.onrender.com").replace(/\/+$/, "");
  const endpoint = path => `${baseUrl}/api/${String(path).replace(/^\/+/, "")}`;
  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Token ${token}` } : {};
  };
  async function request(path, options = {}) {
    const headers = { ...authHeaders(), ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...options.headers };
    let response;
    try { response = await fetch(endpoint(path), { ...options, headers }); }
    catch { throw new Error("Não foi possível conectar ao servidor. Tente novamente."); }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = data?.detail || data?.error || (data && Object.values(data).flat().find(x => typeof x === "string"));
      const error = new Error(message || `Erro ao acessar o servidor (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return data;
  }
  async function list(path, maxPages = 15) {
    let next = endpoint(path), all = [];
    for (let i = 0; next && i < maxPages; i++) {
      let response;
      try { response = await fetch(next, { headers: authHeaders() }); }
      catch { throw new Error("Não foi possível conectar ao servidor."); }
      if (!response.ok) throw new Error(`Falha ao carregar dados (${response.status}).`);
      const data = await response.json();
      if (Array.isArray(data)) return [...all, ...data];
      all.push(...(data.results || []));
      next = data.next;
    }
    return all;
  }
  const cache = new Map();
  async function ensureMovie(movie) {
    if (!movie?.title) throw new Error("Filme inválido.");
    const key = String(movie.tmdb_id || movie.catalogKey || movie.title);
    if (cache.has(key)) return cache.get(key);
    const numericId = Number(movie.tmdb_id || movie.id);
    const tmdb_id = Number.isSafeInteger(numericId) && numericId > 0 ? numericId : null;
    const found = await list(`movies/?search=${encodeURIComponent(movie.title)}`, 10);
    let db = found.find(m => tmdb_id && Number(m.tmdb_id) === tmdb_id)
      || found.find(m => m.title.toLocaleLowerCase("pt-BR") === movie.title.toLocaleLowerCase("pt-BR"));
    if (!db) {
      const poster = window.CineCena?.posterURL(movie) || movie.poster || "";
      db = await request("movies/", { method: "POST", body: JSON.stringify({
        title: movie.title, original_title: movie.original_title || movie.title,
        synopsis: movie.overview || "", release_date: /^\d{4}-\d{2}-\d{2}$/.test(movie.release_date || "") ? movie.release_date : null,
        poster_url: /^https?:\/\//i.test(poster) ? poster : "",
        backdrop_url: /^https?:\/\//i.test(movie.backdrop || "") ? movie.backdrop : "",
        genres: (movie.genres || []).map(g => typeof g === "string" ? g : g.name).filter(Boolean),
        country: "Brasil", ...(tmdb_id ? { tmdb_id } : {})
      }) });
    }
    cache.set(key, db);
    return db;
  }
  window.CINECENA_API = { baseUrl, endpoint, request, list, ensureMovie, authHeaders };
})();
