const ACCESS_TOKEN_KEY = 'accessToken';
const LEGACY_ACCESS_TOKEN_COOKIE = 'accessToken';

const clearLegacyAccessTokenCookie = (): void => {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = `${LEGACY_ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== 'number') {
    return true;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return exp <= nowInSeconds;
};

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  clearLegacyAccessTokenCookie();

  const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) {
    return null;
  }

  if (isTokenExpired(token)) {
    removeAuthToken();
    return null;
  }

  return token;
};

export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const removeAuthToken = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  clearLegacyAccessTokenCookie();
};

export const parseBearerToken = (authorizationHeader?: string | null): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const matched = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return matched?.[1]?.trim() || null;
};
