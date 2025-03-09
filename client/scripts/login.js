document.addEventListener('DOMContentLoaded', () => {
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginButton = document.getElementById('login');
  const errorText = document.getElementById('error');

  loginButton.addEventListener('click', async () => {
    errorText.innerText = '';
    const username = usernameInput.value;
    const password = passwordInput.value;
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({username, password})
    });
    if (!response.ok) {
      switch (response.status) {
        case 400:
          errorText.innerText = 'Missing username or password';
          return
        case 401:
          errorText.innerText = 'Invalid username or password';
          return;
        case 429:
          errorText.innerText = 'You\'re trying to login too often, slow down!';
          return;
        default:
          errorText.innerText = 'Something went wrong';
          return;
      }
    }
    localStorage.setItem('auth-token', await response.text());
    window.location.href = '/';
  });
});
