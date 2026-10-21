(() => {
    const App = window.CineCena;

    if (!App) return;

    const { escapeHTML, icon, toast } = App;

    const API_URL =
        window.CINECENA_API.endpoint("follows/");

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
                search.value.trim() ? "Nenhum perfil encontrado" : "Você ainda não segue ninguém",
                search.value.trim()
                    ? "Tente pesquisar com outro nome de usuário."
                    : "Pesquise pessoas pelo nome de usuário para começar a seguir."
            );

            return;
        }

        target.innerHTML = users.map(user => {
            const username =
                escapeHTML(user.username);

            const buttonLabel =
                user.is_following
                    ? "Deixar de seguir"
                    : `${icon("plus")} Seguir`;

            const buttonClass =
                user.is_following
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
                                user.is_following
                                    ? `
                                        <span>
                                            Você segue este perfil.
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

        if (term.length === 1) {
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
            term ? "Buscando usuários" : "Carregando quem você segue",
            "Aguarde enquanto procuramos contas no CineCena."
        );

        try {
            if (!term) {
                const follows = await window.CINECENA_API.list("follows/?follower=me");
                if (currentRequest !== requestNumber) return;
                users = follows.map(follow => ({
                    id: follow.following,
                    username: follow.following_username,
                    avatar: follow.following_avatar,
                    is_following: true,
                    follow_id: follow.id,
                }));
                renderUsers();
                return;
            }

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
            window.dispatchEvent(new Event("cinecena:friend-updated"));

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

            if (user.is_following) {
                if (!user.follow_id) {
                    throw new Error(
                        "Não foi possível identificar este seguimento. Atualize a pesquisa."
                    );
                }

                response = await fetch(
                    `${API_URL}${user.follow_id}/`,
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
                            following: user.id,
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
                    "Não foi possível atualizar quem você segue."
                );
            }

            if (user.is_following) {
                user.is_following = false;
                user.follow_id = null;
                if (!search.value.trim()) {
                    users = users.filter(item => item.id !== user.id);
                }

                toast("Você deixou de seguir este perfil.");

            } else {
                user.is_following = true;
                user.follow_id = data.id;

                toast("Agora você segue este perfil.");
            }

            renderUsers();
            window.dispatchEvent(new Event("cinecena:friend-updated"));

        } catch (error) {
            console.error(
                "CineCena: erro ao atualizar seguimento:",
                error
            );

            toast(
                error.message ||
                "Não foi possível atualizar quem você segue."
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

    searchUsers();
})();