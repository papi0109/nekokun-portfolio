// Runtime config injected at deploy time for production
// Do not put secrets here. For production, this file is overwritten by CI.
window.__APP_CONFIG__ = {
  // Example (GAS Web App): "https://script.google.com/macros/s/XXXX/exec"
  // This should be the full URL that returns the portfolio JSON.
  API_URL: ""
};
