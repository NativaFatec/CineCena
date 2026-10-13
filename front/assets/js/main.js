const body = document.body;
const themeToggle = document.getElementById("themeToggle");
const mobileThemeToggle = document.getElementById("mobileThemeToggle");

function updateThemeButtons() {
  const isDark = body.classList.contains("theme-dark");

  if (themeToggle) {
    const icon = themeToggle.querySelector(".theme-toggle-icon");

    if (icon) {
      icon.textContent = isDark ? "☼" : "☽";
    }
  }

  if (mobileThemeToggle) {
    const icon = mobileThemeToggle.querySelector(".theme-toggle-icon");

    if (icon) {
      icon.textContent = isDark ? "☼" : "☽";
    }
  }
}

function toggleTheme() {
  body.classList.toggle("theme-light");
  body.classList.toggle("theme-dark");
  updateThemeButtons();
}

if (themeToggle) {
  themeToggle.addEventListener("click", toggleTheme);
}

if (mobileThemeToggle) {
  mobileThemeToggle.addEventListener("click", toggleTheme);
}

updateThemeButtons();

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    // 1. Se não houver token salvo, impede acesso e redireciona para a tela de login
    if (!token) {
        window.location.href = '../index.html';
        return;
    }

    let user = storedUser ? JSON.parse(storedUser) : null;

    // 2. Busca os dados atualizados do usuário logado na API (/api/accounts/me/)
    try {
        const response = await fetch(window.CINECENA_API.endpoint("accounts/me/"), {
            headers: {
                'Authorization': `Token ${token}`,
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
            // Pega as 2 primeiras letras do nome de usuário para o avatar
            const initials = user.username.substring(0, 2).toUpperCase();
            avatarEl.textContent = initials;
        }
    }

    // 4. Lógica para o Botão de Sair (Logout)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '../index.html';
        });
    }
});