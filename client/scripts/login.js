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
        case 429:
          errorText.innerText = 'You\'re trying to login too often, slow down!';
          return;
        default:
          errorText.innerText = 'Something went wrong';
      }
    }
    const data = await response.json();
    if (data?.username) {
      localStorage.setItem('user', JSON.stringify(data));
      window.location.href = '/';
    } else {
      errorText.innerText = data;
    }
  });
});
