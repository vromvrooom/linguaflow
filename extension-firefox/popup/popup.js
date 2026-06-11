const API_URL = 'https://linguaflow1.duckdns.org/api';
const APP_URL = 'https://linguaflow1.duckdns.org';
const isFirefox = typeof browser !== 'undefined';

const statusEl = document.getElementById('status');
const loggedOut = document.getElementById('logged-out');
const loggedIn = document.getElementById('logged-in');
const loginHint = document.getElementById('login-hint');
const openLoginBtn = document.getElementById('open-login-btn');

// Firefox не підтримує externally_connectable — автологін з сайту неможливий,
// тож показуємо інструкцію для ручного копіювання токена з DevTools
if (isFirefox) {
  loginHint.textContent = 'Відкрийте LinguaFlow → скопіюйте токен з DevTools (localStorage.auth_token) → вставте нижче';
  openLoginBtn.textContent = 'Відкрити LinguaFlow';
}

function showLoggedIn() {
  loggedOut.style.display = 'none';
  loggedIn.style.display = 'block';
  statusEl.textContent = '● Підключено';
  statusEl.classList.add('connected');
}

function showLoggedOut() {
  loggedOut.style.display = 'block';
  loggedIn.style.display = 'none';
  statusEl.textContent = '● Не підключено';
  statusEl.classList.remove('connected');
}

function loadStats() {
  chrome.runtime.sendMessage({ type: 'GET_STATS' }, (res) => {
    if (!res?.ok) return;
    const { stats, words } = res;
    document.getElementById('streak').textContent = stats?.streakDay ?? 0;
    document.getElementById('words').textContent = words?.pagination?.total ?? 0;
    document.getElementById('minutes').textContent = stats?.englishMinutes ?? 0;
    document.getElementById('searches').textContent = stats?.englishSearches ?? 0;
  });
}

chrome.runtime.sendMessage({ type: 'GET_TOKEN' }, (res) => {
  if (res?.token) {
    showLoggedIn();
    loadStats();
  } else {
    showLoggedOut();
  }
});

document.getElementById('connect-btn').addEventListener('click', () => {
  const token = document.getElementById('token-input').value.trim();
  if (!token) return;
  chrome.runtime.sendMessage({ type: 'SET_TOKEN', token }, () => {
    showLoggedIn();
    loadStats();
  });
});

openLoginBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: isFirefox ? `${APP_URL}/dashboard` : `${APP_URL}/login` });
});

document.getElementById('dashboard-btn').addEventListener('click', () => {
  chrome.tabs.create({ url: `${APP_URL}/dashboard` });
});

document.getElementById('logout-btn').addEventListener('click', () => {
  chrome.storage.local.clear(() => {
    showLoggedOut();
  });
});
