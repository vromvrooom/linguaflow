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
