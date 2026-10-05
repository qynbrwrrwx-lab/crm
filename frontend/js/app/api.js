// app : api.

async function apiFetch(url, options = {}) {

  const token = getToken();

  const { silent = false, ...requestOptions } = options;

  const config = {

    headers: {

      "Content-Type": "application/json",

      ...(token && {
        Authorization: "Bearer " + token
      })
    },

    ...requestOptions
  };

  try {

    const res = await fetch(
      API_URL + url,
      config
    );

    if (res.status === 401) {

      logout();

      throw new Error(
        "Session expirée"
      );
    }

    if (!res.ok) {

      let err = {};

      try {

        err = await res.json();

      } catch {

        err = {
          error: "Erreur serveur"
        };
      }

      console.error(
        "❌ API ERROR :",
        err
      );

      throw new Error(
        err.error || "Erreur API"
      );
    }

    return await res.json();

  } catch (err) {

    if (!silent) {
      console.error(
        "❌ FETCH ERROR :",
        err
      );
    }

    throw err;
  }
}
