try {
    if (localStorage.getItem("token")) {
      document.documentElement.classList.add("session-restoring");
    }
  } catch (error) {
    // Le navigateur peut bloquer le stockage local dans certains contextes prives.
  }
