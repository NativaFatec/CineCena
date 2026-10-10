
window.CINECENA_API = (() => {
  const isCodespaces = window.location.hostname.endsWith("app.github.dev");

  const baseUrl = isCodespaces
    ? `${window.location.protocol}//${window.location.hostname.replace("-5500.", "-8000.")}`
    : "http://127.0.0.1:8000";

  return {
    baseUrl,
    accounts: `${baseUrl}/api/accounts`,
    endpoint: path => `${baseUrl}/api/${path.replace(/^\/+/, "")}`
  };
})();
