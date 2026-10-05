const token = window.location.pathname.split("/").pop();

async function reset() {
  const password = document.getElementById("password").value;

  const res = await fetch("/reset-password/" + token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });

  const data = await res.json();

  if (data.success) {
    alert("Mot de passe changé ✅");
    window.location.href = "/";
  } else {
    alert(data.error);
  }
}
