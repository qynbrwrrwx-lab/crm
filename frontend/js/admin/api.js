// admin : api.

function adminToken() {
  return localStorage.getItem("token");
}

function adminSessionError(message) {
  const error = new Error(message);
  error.sessionExpired = true;
  return error;
}

async function adminApiFetch(url, options = {}) {
  const token = adminToken();
  if (!token) {
    window.location.href = "/admin-login";
    throw adminSessionError("Session expirée");
  }
  const response = await fetch(window.location.origin + url, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
    ...options
  });
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "/admin-login";
    throw adminSessionError("Accès administrateur requis");
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Erreur serveur");
  }
  return response.json();
}

function logoutAdmin() {
  localStorage.removeItem("token");
  window.location.href = "/admin-login";
}
