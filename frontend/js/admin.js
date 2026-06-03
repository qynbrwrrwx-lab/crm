// ================= LOAD ADMIN =================


async function loadAdminUsers() {

  try {

    const users =
      await apiFetch(
        "/api/admin/users"
      );

    document.getElementById(
      "totalUsers"
    ).innerText = users.length;

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
            margin-bottom:6px;
          ">
            Role :
            ${user.role}
          </div>

          <div style="
            color:#94a3b8;
            font-size:14px;
            margin-bottom:6px;
          ">
            Vérifié :
            ${
              user.isVerified
                ? "✅ Oui"
                : "❌ Non"
            }
          </div>

          <div style="
            color:#94a3b8;
            font-size:14px;
          ">
            Inscription :
            ${new Date(
              user.createdAt
            ).toLocaleDateString()}
          </div>

        </div>
      `;
    });

  } catch (err) {

    console.error(err);

    alert("Erreur admin");
  }
}