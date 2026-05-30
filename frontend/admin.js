async function adminLogin() {

  const email =
    document.getElementById(
      "adminEmail"
    ).value;

  const password =
    document.getElementById(
      "adminPassword"
    ).value;

  try {

    const res = await fetch(
      "/api/auth/login",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          email,
          password
        })
      }
    );

    const data =
      await res.json();

    if (!res.ok) {

      alert(
        data.error ||
        "Erreur connexion"
      );

      return;
    }

    localStorage.setItem(
      "token",
      data.token
    );

    window.location.href =
      "/admin";

  } catch (err) {

    console.error(err);

    alert(
      "Erreur serveur"
    );
  }
}

async function loadAdminUsers() {

  const token =
    localStorage.getItem(
      "token"
    );

  if (!token) {

    window.location.href =
      "/admin-login";

    return;
  }

  try {

    const res =
      await fetch(
        "/api/admin/users",
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    const users =
      await res.json();

    document.getElementById(
      "totalUsers"
    ).innerText =
      users.length;

    const container =
      document.getElementById(
        "adminUsers"
      );

    container.innerHTML = "";

    users.forEach(user => {

      container.innerHTML += `

      <div style="
      background:#0f172a;
      padding:18px;
      border-radius:18px;
      margin-bottom:14px;
      border:1px solid rgba(255,255,255,0.06);
      ">

      <div style="
      color:white;
      font-size:16px;
      font-weight:700;
      margin-bottom:8px;
      ">
      ${user.email}
      </div>

      <div style="
      color:#94a3b8;
      font-size:14px;
      ">
      Role : ${user.role}
      </div>

      </div>

      `;
    });

  } catch (err) {

    console.error(err);

    alert(
      "Erreur admin"
    );
  }
}

if (
  document.getElementById(
    "adminUsers"
  )
) {
  loadAdminUsers();
}

function logoutAdmin() {

  localStorage.removeItem(
    "token"
  );

  window.location.href =
    "/admin-login";
}