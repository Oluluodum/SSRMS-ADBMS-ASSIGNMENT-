const form = document.querySelector('#login-form');
const errorBox = document.querySelector('#login-error');
const submitButton = form.querySelector('button[type="submit"]');

try {
  const response = await fetch('/api/auth/me', { signal: AbortSignal.timeout(10000) });
  if (response.ok) window.location.replace('/dashboard.html');
} catch (error) {
  errorBox.textContent = error.name === 'TimeoutError'
    ? 'The server is taking too long to respond. Try again.'
    : 'Could not connect to the server. Open the app through http://localhost:3000.';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.textContent = '';
  submitButton.disabled = true;
  submitButton.textContent = 'Signing in…';
  const formData = new FormData(form);
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData)),
      signal: AbortSignal.timeout(15000)
    });
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error('The server returned an unreadable response. Check that the backend is running.');
    }
    if (!response.ok) {
      const message = result.error ?? 'Sign-in failed.';
      throw new Error(response.status === 401
        ? `${message} If this is a fresh setup, run npm run db:seed in D:\\ADBMS\\ADBMS first.`
        : message);
    }
    window.location.assign('/dashboard.html');
  } catch (error) {
    errorBox.textContent = error.name === 'TimeoutError'
      ? 'Sign-in timed out. Check that the backend and database are running, then try again.'
      : error.message || 'Could not connect to the server.';
    submitButton.disabled = false;
    submitButton.textContent = 'Sign in';
  }
});
