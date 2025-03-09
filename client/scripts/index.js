document.addEventListener('DOMContentLoaded', async () => {
  const newTweetInput = document.getElementById('new-tweet');
  const postTweetButton = document.getElementById('post-tweet');
  const postTweetError = document.getElementById('post-error');
  const feedError = document.getElementById('feed-error');
  const logoutButton = document.getElementById('logout');

  if (!localStorage.getItem('auth-token')) {
    window.location.href = '/login.html';
  }

  const logout = () => {
    localStorage.removeItem('auth-token');
    window.location.href = '/login.html';
  }

  const generateTweet = (tweet) => {
    const date = new Date(tweet.timestamp).toLocaleDateString('de-CH', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    });
    return `
        <div id="feed" class="flex flex-col gap-2 w-full">
            <div class="bg-slate-600 rounded p-4 flex gap-4 items-center border-l-4 border-blue-400" >
                <img src="./img/tweet.png" alt="SwitzerChees" class="w-14 h-14 rounded-full" />
                <div class="flex flex-col grow">
                <div class="flex flex-col gap-2">
                    <div class="flex justify-between text-gray-200">
                    <h3 class="font-semibold">${tweet.username}</h3>
                    <p class="text-sm">${date}</p>
                    </div>
                </div>
                <p>${tweet.text}</p>
                </div>
            </div>
        </div>
      `;
  };

  const getFeed = async () => {
    feedError.innerText = '';
    const response = await fetch(`/api/feed`, {
      headers: {
        authorization: `Bearer ${localStorage.getItem('auth-token')}`
      }
    });
    if (!response.ok) {
      switch (response.status) {
        case 401:
          logout(); // if we get an unauthorized status code, we force a logout
          return
        case 429:
          feedError.innerText = 'You\'re reloading too often, slow down!';
          return;
        default:
          feedError.innerText = 'Something went wrong';
      }
    } else {
      try {
        const tweets = await response.json();
        document.getElementById('feed').innerHTML = tweets.map(generateTweet).join('');
      } catch {
        feedError.innerText = 'Could not parse tweets';
      }
    }
  };

  const postTweet = async () => {
    postTweetError.innerText = '';
    const response = await fetch('/api/feed', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: newTweetInput.value
      })
    });
    if (!response.ok) {
      switch (response.status) {
        case 400:
          postTweetError.innerText = 'Please enter a valid thought';
          return;
        case 401:
          logout(); // if we get an unauthorized status code, we force a logout
          return
        case 429:
          postTweetError.innerText = 'You\'re thinking too much, slow down!';
          return;
        default:
          postTweetError.innerText = 'Something went wrong';
      }
    }
    await getFeed();
    newTweetInput.value = '';
  };

  postTweetButton.addEventListener('click', postTweet);
  newTweetInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      postTweet();
    }
  });

  logoutButton.addEventListener('click', logout);

  await getFeed();
});
