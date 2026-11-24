const form = document.querySelector('#login-form');
const errorBox = document.querySelector('#login-error');

try {
  const response = await fetch('/api/auth/me');
  if (response.ok) window.location.replace('/dashboard.html');
} catch {
  errorBox.textContent = 'Could not connect to the server.';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.textContent = '';
  const formData = new FormData(form);
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? 'Sign-in failed.');
    window.location.assign('/dashboard.html');
  } catch (error) {
    errorBox.textContent = error.message || 'Could not connect to the server.';
  }
});
