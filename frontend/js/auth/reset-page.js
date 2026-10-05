// Modèles HTML des pages d’assistance.

function renderPasswordResetPage() {
  return `

  <div style="
    min-height:100vh;

    display:flex;
    justify-content:center;
    align-items:center;

    background:
    radial-gradient(
      circle at bottom,
      #2563eb 0%,
      #0f172a 45%,
      #020617 100%
    );

    font-family:Inter,sans-serif;

    padding:20px;
  ">

    <div style="
      width:100%;
      max-width:420px;

      position:relative;

      background:rgba(15,23,42,0.78);

      border:1px solid rgba(255,255,255,0.08);

      backdrop-filter:blur(18px);

      border-radius:28px;

      padding:34px 34px 30px 34px;

      box-shadow:
        0 0 60px rgba(37,99,235,0.35),
        0 0 120px rgba(37,99,235,0.18);

      text-align:center;
    ">

      <img
        src="/logo.png"
        alt="My Prospect"
        style="
          width:450px;

          margin-top:-118px;
          margin-bottom:-82px;

          object-fit:contain;

          display:block;

          margin-left:auto;
          margin-right:auto;
        "
      >

      <p style="
        color:#e2e8f0;

        font-size:16px;

        line-height:1.5;

        margin-top:8px;

        margin-bottom:24px;

        font-weight:500;
      ">
        Sécurisez votre compte avec un nouveau mot de passe.
      </p>

      <div style="
        position:relative;

        margin-bottom:18px;
      ">

        <input
          id="newPassword"
          type="password"
          placeholder="Nouveau mot de passe"

          style="
            width:100%;

            padding:18px 55px 18px 18px;

            border:none;

            border-radius:16px;

            background:#0f172a;

            color:white;

            font-size:16px;

            outline:none;

            box-sizing:border-box;
          "
        >

        <button
          onclick="togglePassword()"

          style="
            position:absolute;

            right:18px;

            top:50%;

            transform:translateY(-50%);

            background:transparent;

            border:none;

            color:#94a3b8;

            cursor:pointer;

            display:flex;

            align-items:center;

            justify-content:center;

            padding:0;
          "
        >

          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"></path>

            <circle cx="12" cy="12" r="3"></circle>
          </svg>

        </button>

      </div>

      <div style="
        margin-bottom:18px;
      ">

        <input
          id="confirmNewPassword"
          type="password"
          placeholder="Confirmer le nouveau mot de passe"
          autocomplete="new-password"

          style="
            width:100%;

            padding:18px;

            border:none;

            border-radius:16px;

            background:#0f172a;

            color:white;

            font-size:16px;

            outline:none;

            box-sizing:border-box;
          "
        >

      </div>

      <button
        onclick="resetPassword()"

        style="
          width:100%;

          padding:18px;

          border:none;

          border-radius:16px;

          background:
          linear-gradient(
            90deg,
            #22d3ee,
            #2563eb
          );

          color:white;

          font-size:17px;

          font-weight:700;

          cursor:pointer;

          transition:0.3s;

          box-shadow:
            0 10px 30px rgba(37,99,235,0.35);
        "
      >
        Modifier le mot de passe
      </button>

    </div>

  </div>

  `;
}
