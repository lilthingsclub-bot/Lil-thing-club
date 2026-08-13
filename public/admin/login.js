document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("loginForm");
  const message = document.getElementById("loginMessage");

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    const { data } = await supabaseClient.rpc("is_lil_things_admin");
    if (data === true) location.href = "products.html";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "Logging in…";
    message.className = "message";

    const { error } = await supabaseClient.auth.signInWithPassword({
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value
    });

    if (error) {
      message.textContent = error.message;
      message.className = "message error";
      return;
    }

    const { data: isAdmin, error: adminError } =
      await supabaseClient.rpc("is_lil_things_admin");

    if (adminError || isAdmin !== true) {
      await supabaseClient.auth.signOut();
      message.textContent = "This account is not an approved Lil Things Club admin.";
      message.className = "message error";
      return;
    }

    location.href = "products.html";
  });
});
