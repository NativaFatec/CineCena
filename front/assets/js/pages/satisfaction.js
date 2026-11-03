(() => {
  "use strict";

  const api = window.CINECENA_API;
  const form = document.querySelector("#satisfaction-form");
  const status = document.querySelector("#satisfaction-status");
  const submit = document.querySelector("#satisfaction-submit");
  if (!api || !form || !status || !submit) return;

  const labels = ["navigation", "movies", "reviews", "profiles", "overall"];
  const mobileMenu = document.querySelector("[data-mobile-menu]");
  const mobilePanel = document.querySelector("[data-mobile-panel]");
  mobileMenu?.addEventListener("click", () => {
    const open = mobilePanel.classList.toggle("open");
    mobileMenu.setAttribute("aria-expanded", String(open));
  });

  function showStatus(message, type = "info") {
    status.textContent = message;
    status.dataset.type = type;
    status.hidden = false;
  }

  function handleLogin() {
    form.hidden = true;
    status.replaceChildren(
      document.createTextNode("Para responder à pesquisa, "),
      Object.assign(document.createElement("a"), {
        href: "../index.html", textContent: "entre na sua conta"
      }),
      document.createTextNode(".")
    );
    status.dataset.type = "error";
    status.hidden = false;
  }

  function populate(data) {
    for (const key of labels) {
      const input = form.querySelector(`input[name="${key}"][value="${data[key]}"]`);
      if (input) input.checked = true;
    }
    form.elements.suggestions.value = data.suggestions || "";
    submit.textContent = "Atualizar avaliação";
  }

  async function initialize() {
    if (!localStorage.getItem("token")) {
      handleLogin();
      return;
    }
    try {
      const [user, saved] = await Promise.all([
        api.request("accounts/me/"),
        api.request("satisfaction/"),
      ]);
      const username = user.username || "Usuário";
      document.querySelectorAll("[data-own-name]").forEach(el => el.textContent = username);
      document.querySelectorAll("[data-own-avatar]").forEach(el => {
        if (user.avatar) {
          const image = document.createElement("img");
          image.src = user.avatar;
          image.alt = "";
          image.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:50%";
          el.replaceChildren(image);
        } else {
          el.textContent = username.slice(0, 2).toUpperCase();
        }
      });
      if (saved.answered && saved.data) {
        populate(saved.data);
        showStatus("Você já respondeu à pesquisa neste mês. Se desejar, pode atualizar suas respostas.");
      }
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        handleLogin();
      } else {
        showStatus(error.message || "Não foi possível carregar a pesquisa.", "error");
      }
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (!localStorage.getItem("token")) {
      handleLogin();
      return;
    }
    const values = new FormData(form);
    const payload = {};
    for (const key of labels) {
      const value = values.get(key);
      if (!value) {
        showStatus("Responda às cinco perguntas antes de enviar.", "error");
        return;
      }
      payload[key] = Number(value);
    }
    payload.suggestions = String(values.get("suggestions") || "").trim();
    submit.disabled = true;
    submit.textContent = "Enviando...";
    try {
      const saved = await api.request("satisfaction/", {
        method: "POST", body: JSON.stringify(payload),
      });
      showStatus(saved.message || "Sua avaliação foi registrada. Obrigado!", "success");
      submit.textContent = "Atualizar avaliação";
    } catch (error) {
      if (error.status === 401 || error.status === 403) handleLogin();
      else showStatus(error.message || "Não foi possível enviar sua avaliação.", "error");
    } finally {
      submit.disabled = false;
      if (!form.hidden && submit.textContent === "Enviando...") {
        submit.textContent = "Enviar avaliação";
      }
    }
  });

  initialize();
})();
