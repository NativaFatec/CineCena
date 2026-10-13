(() => {
  const hostname = window.location.hostname;
  let baseUrl = "http://127.0.0.1:8000";

  // Se estiver a rodar no GitHub Codespaces (substitui a porta do Live Server 5500 pela 8000)
  if (hostname.includes("github.dev")) {
    baseUrl = `https://${hostname.replace(/-5500\./, "-8000.")}`;
  }

  window.CINECENA_API = {
    baseUrl: baseUrl
  };
})();
