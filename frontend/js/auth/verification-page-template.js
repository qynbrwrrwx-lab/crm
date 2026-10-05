// Gabarit partagé par les écrans de résultat de vérification e-mail.
function renderEmailVerificationResult({ title, message, actionLabel }) {
  return `
    <div style="min-height:100vh;display:flex;justify-content:center;align-items:center;background:radial-gradient(circle at bottom,#2563eb 0%,#0f172a 45%,#020617 100%);font-family:Inter,sans-serif;padding:20px">
      <div style="width:100%;max-width:420px;background:rgba(15,23,42,0.78);border:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(18px);border-radius:28px;padding:34px 34px 30px;box-shadow:0 0 60px rgba(37,99,235,0.35),0 0 120px rgba(37,99,235,0.18);text-align:center">
        <img src="/logo.png" style="width:450px;margin-top:-118px;margin-bottom:-82px;object-fit:contain;display:block;margin-left:auto;margin-right:auto">
        <h1 style="color:white;font-size:20px;margin-bottom:14px;font-weight:800">${title}</h1>
        <p style="color:#e2e8f0;font-size:16px;line-height:1.5;margin-bottom:24px">${message}</p>
        <a href="/login" style="display:flex;justify-content:center;align-items:center;width:100%;padding:18px;border-radius:16px;background:linear-gradient(90deg,#22d3ee,#2563eb);color:white;text-decoration:none;font-size:17px;font-weight:700;box-sizing:border-box">${actionLabel}</a>
      </div>
    </div>
  `;
}
