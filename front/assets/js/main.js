const body = document.body;
const themeToggle = document.getElementById("themeToggle");
const mobileThemeToggle = document.getElementById("mobileThemeToggle");

// Configuração centralizada da URL da API (Backend no Codespaces na porta 8000)
const API_BASE_URL = window.CINECENA_API?.baseUrl || 'cinecena.onrender.com';

function updateThemeButtons() {
  const isDark = body.classList.contains("theme-dark");

  if (themeToggle) {
    const icon = themeToggle.querySelector(".theme-toggle-icon");
    if (icon) icon.textContent = isDark ? "☼" : "☽";
  }

  if (mobileThemeToggle) {
    const icon = mobileThemeToggle.querySelector(".theme-toggle-icon");
    if (icon) icon.textContent = isDark ? "☼" : "☽";
  }
}

function toggleTheme() {
  body.classList.toggle("theme-light");
  body.classList.toggle("theme-dark");
  updateThemeButtons();
}

if (themeToggle) themeToggle.addEventListener("click", toggleTheme);
if (mobileThemeToggle) mobileThemeToggle.addEventListener("click", toggleTheme);

updateThemeButtons();

// FUNÇÃO PARA ADICIONAR UM FILME AOS FAVORITOS
async function adicionarFavorito(movieDbId, title, posterUrl) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert("Você precisa estar logado para favoritar!");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/movies/favorites/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        movie_id: movieDbId,
        title: title,
        poster_url: posterUrl
      })
    });

    if (response.ok) {
      alert("Filme adicionado aos favoritos!");
    } else {
      const errData = await response.json();
      alert(`Erro ao favoritar: ${errData.detail || response.statusText}`);
    }
  } catch (err) {
    console.error("Erro na requisição de favoritos:", err);
  }
}

// FUNÇÃO PARA CARREGAR OS FILMES BRASILEIROS SALVOS NO BANCO DE DADOS
async function carregarFilmesDoBanco() {
  const container = document.querySelector('[data-movies-list]') || document.getElementById('movies-container') || document.getElementById('movies-grid');
  if (!container) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/movies/`);
    if (!response.ok) throw new Error("Erro ao carregar filmes da API.");

    const data = await response.json();
    const filmes = data.results ? data.results : data;

    if (filmes.length === 0) {
      container.innerHTML = "<p>Nenhum filme brasileiro cadastrado no banco ainda.</p>";
      return;
    }

    container.innerHTML = filmes.map(filme => `
      <div class="movie-card" data-id="${filme.id}">
        <div class="poster-wrapper">
          <img src="${filme.poster_url || '../assets/img/placeholder.png'}" alt="${filme.title}">
        </div>
        <div class="movie-info">
          <h3>${filme.title}</h3>
          <span class="movie-year">${filme.release_date ? filme.release_date.split('-')[0] : 'Brasil'}</span>
          <button onclick="adicionarFavorito(${filme.tmdb_id}, '${filme.title.replace(/'/g, "\\'")}', '${filme.poster_url}')" class="btn-fav">
            ♥ Favoritar
          </button>
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error("Erro ao buscar filmes do backend:", err);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    // 1. Se não houver token salvo, impede acesso e redireciona para a tela de login
    if (!token) {
        window.location.href = '../index.html';
        return;
    }

    let user = storedUser ? JSON.parse(storedUser) : null;

    // 2. Busca os dados atualizados do usuário logado na API (/api/auth/me/) com Bearer Token
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            user = await response.json();
            localStorage.setItem('user', JSON.stringify(user));
        } else if (response.status === 401) {
            // Token inválido ou expirado
            localStorage.clear();
            window.location.href = '../index.html';
            return;
        }
    } catch (err) {
        console.warn('Não foi possível validar o token online, usando dados do cache local.', err);
    }

    // 3. Atualiza a interface com as informações do usuário logado
    if (user) {
        const nameEl = document.querySelector('[data-user-name]');
        const avatarEl = document.querySelector('[data-user-avatar]');

        if (nameEl) {
            nameEl.textContent = `@${user.username}`;
        }

        if (avatarEl) {
            const initials = user.username.substring(0, 2).toUpperCase();
            avatarEl.textContent = initials;
        }
    }

    // 4. Lógica para o Botão de Sair (Logout)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = '../index.html';
        });
    }

    // 5. Carrega a lista de filmes vinda do Banco de Dados
    carregarFilmesDoBanco();
});