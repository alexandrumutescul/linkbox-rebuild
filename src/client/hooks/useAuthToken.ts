import { useCallback, useEffect, useState } from 'react';

const TOKEN_STORAGE_KEY = 'linkbox.apiToken';

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readSavedToken(): string | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(() => readSavedToken());

  useEffect(() => {
    setToken(readSavedToken());
  }, []);

  const saveToken = useCallback((nextToken: string) => {
    const trimmedToken = nextToken.trim();
    if (!trimmedToken) {
      return;
    }

    if (canUseLocalStorage()) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, trimmedToken);
    }

    setToken(trimmedToken);
  }, []);

  const clearToken = useCallback(() => {
    if (canUseLocalStorage()) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }

    setToken(null);
  }, []);

  return {
    token,
    hasToken: Boolean(token),
    saveToken,
    clearToken,
  };
}

export const authTokenStorageKey = TOKEN_STORAGE_KEY;
