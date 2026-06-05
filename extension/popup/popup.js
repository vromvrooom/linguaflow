const API_URL = 'http://194.28.84.152/api';
const APP_URL = 'http://194.28.84.152';

const statusEl = document.getElementById('status');
const loggedOut = document.getElementById('logged-out');
const loggedIn = document.getElementById('logged-in');

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

document.getElementById('open-login-btn').addEventListener('click', () => {
  chrome.tabs.create({ url: `${APP_URL}/login` });
});

document.getElementById('dashboard-btn').addEventListener('click', () => {
  chrome.tabs.create({ url: `${APP_URL}/dashboard` });
});

document.getElementById('logout-btn').addEventListener('click', () => {
  chrome.storage.local.clear(() => {
    showLoggedOut();
  });
});
