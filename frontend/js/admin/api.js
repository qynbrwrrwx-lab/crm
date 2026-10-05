// admin : api.

function adminToken() {
  return localStorage.getItem("token");
}

async function adminApiFetch(url, options = {}) {
  const token = adminToken();
  if (!token) {
    window.location.href = "/admin-login";
    throw new Error("Session expirée");
  }
  const response = await fetch(window.location.origin + url, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
    ...options
  });
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "/admin-login";
    throw new Error("Accès administrateur requis");
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
