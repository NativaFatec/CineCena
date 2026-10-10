(() => {
    const App = window.CineCena;

    if (!App) return;

    const { escapeHTML, icon, toast } = App;

    const API_URL =
        window.CINECENA_API.endpoint("friendships/");

    const target = document.querySelector(
        "[data-friend-results]"
    );

    const search = document.querySelector(
        "[data-friend-search]"
    );

    if (!target || !search) return;

    let users = [];
    let searchTimeout = null;
    let requestNumber = 0;

    function getToken() {
        return localStorage.getItem("token");
    }

    function getHeaders(json = false) {
        const token = getToken();

        return {
            ...(json
                ? { "Content-Type": "application/json" }
                : {}),
            ...(token
                ? { "Authorization": `Token ${token}` }
                : {}),
        };
    }

    function initials(username = "") {
        return String(username)
            .trim()
            .slice(0, 2)
            .toUpperCase();
    }

    function avatarHTML(user) {
        if (user.avatar) {
            return `
                <img
                    src="${escapeHTML(user.avatar)}"
                    alt="${escapeHTML(user.username)}"
                    loading="lazy"
                    style="
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        border-radius: 50%;
                    "
                >
            `;
        }

        return `
            <span
                style="
                    display: flex;
                    width: 100%;
                    height: 100%;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: #eaf2ff;
                    color: #075bc9;
                    font-weight: 700;
                "
            >
                ${escapeHTML(initials(user.username))}
            </span>
        `;
    }

    function renderMessage(title, description) {
        target.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    ${icon("search")}
                </div>

                <div>
                    <strong>${escapeHTML(title)}</strong>
                    <p>${escapeHTML(description)}</p>
                </div>
            </div>
        `;
    }

    function renderUsers() {
        if (!users.length) {
            renderMessage(
                "Nenhum perfil encontrado",
                "Tente pesquisar com outro nome de usuário."
            );

            return;
        }

        target.innerHTML = users.map(user => {
            const username =
                escapeHTML(user.username);

            const buttonLabel =
                user.is_friend
                    ? "Remover amizade"
                    : `${icon("plus")} Adicionar amizade`;

            const buttonClass =
                user.is_friend
                    ? "btn-secondary"
                    : "btn-primary";

            const profileHref =
                "profileusers.html?username=" +
                encodeURIComponent(user.username);

            return `
                <article class="friend-card">
                    <div class="friend-card-main">

                        <div
                            class="friend-avatar"
                            style="
                                width: 92px;
                                height: 92px;
                                flex-shrink: 0;
                                overflow: hidden;
                                border-radius: 50%;
                            "
                        >
                            ${avatarHTML(user)}
                        </div>

                        <div>
                            <h2>${username}</h2>

                            <small>@${username}</small>

                            <p>
                                Usuário cadastrado no CineCena.
                            </p>

                            ${
                                user.is_friend
                                    ? `
                                        <span>
                                            Vocês são amigos.
                                        </span>
                                    `
                                    : ""
                            }
                        </div>
                    </div>

                    <div class="friend-card-actions">

                        <button
                            class="btn ${buttonClass}"
                            type="button"
                            data-toggle-friend
                            data-user-id="${Number(user.id)}"
                        >
                            ${buttonLabel}
                        </button>

                        <a
                            class="btn btn-ghost"
                            href="${escapeHTML(profileHref)}"
                        >
                            Ver perfil
                        </a>

                    </div>
                </article>
            `;
        }).join("");
    }

    async function searchUsers() {
        const currentRequest = ++requestNumber;

        const term = search.value.trim();

        if (term.length < 2) {
            users = [];

            renderMessage(
                "Encontre pessoas",
                "Digite pelo menos dois caracteres para pesquisar usuários."
            );

            return;
        }

        if (!getToken()) {
            renderMessage(
                "Sessão não encontrada",
                "Entre na sua conta para pesquisar pessoas."
            );

            return;
        }

        renderMessage(
            "Buscando usuários",
            "Aguarde enquanto procuramos contas no CineCena."
        );

        try {
            const url =
                `${API_URL}search-users/?search=` +
                encodeURIComponent(term);

            const response = await fetch(url, {
                method: "GET",
                headers: getHeaders(),
            });

            const data = await response.json()
                .catch(() => null);

            // Ignora resultados de pesquisas anteriores.
            if (currentRequest !== requestNumber) {
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                    "Não foi possível pesquisar usuários."
                );
            }

            users = Array.isArray(data) ? data : [];

            renderUsers();

        } catch (error) {
            console.error(
                "CineCena: erro ao pesquisar usuários:",
                error
            );

            if (currentRequest === requestNumber) {
                renderMessage(
                    "Erro ao pesquisar",
                    error.message ||
                    "Não foi possível conectar à API."
                );
            }
        }
    }

    async function toggleFriend(userId, button) {
        const user = users.find(
            item => Number(item.id) === Number(userId)
        );

        if (!user || button.disabled) return;

        const token = getToken();

        if (!token) {
            toast("Entre na sua conta para continuar.");
            return;
        }

        button.disabled = true;

        try {
            let response;

            if (user.is_friend) {
                if (!user.friendship_id) {
                    throw new Error(
                        "Não foi possível identificar esta amizade. Atualize a pesquisa."
                    );
                }

                response = await fetch(
                    `${API_URL}${user.friendship_id}/`,
                    {
                        method: "DELETE",
                        headers: getHeaders(),
                    }
                );

            } else {
                response = await fetch(
                    API_URL,
                    {
                        method: "POST",
                        headers: getHeaders(true),
                        body: JSON.stringify({
                            friend: user.id,
                        }),
                    }
                );
            }

            const data = response.status === 204
                ? null
                : await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                    "Não foi possível atualizar a amizade."
                );
            }

            if (user.is_friend) {
                user.is_friend = false;
                user.friendship_id = null;

                toast("Amizade removida.");

            } else {
                user.is_friend = true;
                user.friendship_id = data.id;

                toast("Amizade adicionada.");
            }

            renderUsers();

        } catch (error) {
            console.error(
                "CineCena: erro ao atualizar amizade:",
                error
            );

            toast(
                error.message ||
                "Não foi possível atualizar a amizade."
            );

        } finally {
            button.disabled = false;
        }
    }

    target.addEventListener("click", event => {
        const button = event.target.closest(
            "[data-toggle-friend]"
        );

        if (!button || !target.contains(button)) {
            return;
        }

        toggleFriend(
            button.dataset.userId,
            button
        );
    });

    search.addEventListener("input", () => {
        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(
            searchUsers,
            250
        );
    });

    renderMessage(
        "Encontre pessoas",
        "Pesquise pelo nome de usuário de alguém cadastrado no CineCena."
    );
})();