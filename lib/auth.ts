const AUTH_TOKEN_KEY = 'auth_token';

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const removeAuthToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const parseBearerToken = (authorizationHeader?: string | null): string | null => {
  if (!authorizationHeader) return null;
  const [type, token] = authorizationHeader.split(' ');
  if (type?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
};
