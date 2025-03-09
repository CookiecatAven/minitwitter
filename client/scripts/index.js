document.addEventListener('DOMContentLoaded', async () => {
  const newTweetInput = document.getElementById('new-tweet');
  const postTweetButton = document.getElementById('post-tweet');
  const postTweetError = document.getElementById('post-error');
  const logoutButton = document.getElementById('logout');

  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    window.location.href = '/login.html';
  }

  const generateTweet = (tweet) => {
    const date = new Date(tweet.timestamp).toLocaleDateString('de-CH', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    });
    const tweetElement = `
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
    return tweetElement;
  };

  const getFeed = async () => {
    const response = await fetch(`/api/feed`);
    const tweets = await response.json();
    document.getElementById('feed').innerHTML = tweets.map(generateTweet).join('');
  };

  const postTweet = async () => {
    postTweetError.innerText = '';
    const response = await fetch('/api/feed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: user.username,
        text: newTweetInput.value
      })
    });
    if (response.status === 400) {
      postTweetError.innerText = 'Please enter a valid thought';
      return;
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

  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  });

  getFeed();
});
