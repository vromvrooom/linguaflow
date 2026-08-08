export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function setToken(token: string, userId: string) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_userId', userId);
  document.cookie = `auth_token=${token}; path=/; max-age=604800`;
}

export function removeToken() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_userId');
  document.cookie = 'auth_token=; path=/; max-age=0';
}

let loggingOut = false;

/**
 * Sign out after the API rejected our token.
 *
 * Clearing the credentials first is what matters: the middleware sends
 * /login straight back to /dashboard while the auth cookie is still set, so
 * redirecting without removeToken() traps the user on the dashboard — every
 * link they click bounces them right back to it.
 */
export function forceLogout() {
  if (loggingOut) return;
  loggingOut = true;
  removeToken();
  window.location.replace('/login');
}
