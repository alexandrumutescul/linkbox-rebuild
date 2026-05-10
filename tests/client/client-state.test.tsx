import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../../src/client/App';
import { authTokenStorageKey } from '../../src/client/hooks/useAuthToken';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

function bookmark(overrides: Partial<{ id: number; url: string; title: string; notes: string | null; tags: string[] }> = {}) {
  return {
    id: overrides.id ?? 1,
    url: overrides.url ?? 'https://example.com',
    title: overrides.title ?? 'Example bookmark',
    notes: overrides.notes ?? 'Useful reference',
    tags: overrides.tags ?? ['docs'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

function mockBookmarkResponses(...responses: Response[]) {
  const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();

  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response);
  }

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function saveToken(token: string) {
  fireEvent.change(screen.getByLabelText(/api token/i), { target: { value: token } });
  fireEvent.click(screen.getByRole('button', { name: /save token/i }));
}

describe('client authenticated state', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('shows the token entry gate when no saved token exists', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /enter your api token/i })).toBeTruthy();
    expect(screen.getByLabelText(/api token/i)).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /your bookmarks/i })).toBeNull();
  });

  it('saves a token, persists it, and uses it for the authenticated bookmark request', async () => {
    const fetchMock = mockBookmarkResponses(jsonResponse({ bookmarks: [bookmark()] }));

    render(<App />);
    await saveToken('  saved-token  ');

    expect(window.localStorage.getItem(authTokenStorageKey)).toBe('saved-token');
    expect(screen.getByText(/loading bookmarks/i)).toBeTruthy();

    await waitFor(() => expect(screen.getByRole('link', { name: /example bookmark/i })).toBeTruthy());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/bookmarks');
    const requestInit = fetchMock.mock.calls[0][1];
    expect(requestInit?.method).toBe('GET');
    expect(new Headers(requestInit?.headers).get('authorization')).toBe('Bearer saved-token');
  });

  it('loads with a token from localStorage after remount and renders returned bookmarks', async () => {
    window.localStorage.setItem(authTokenStorageKey, 'persisted-token');
    const fetchMock = mockBookmarkResponses(
      jsonResponse({ bookmarks: [bookmark({ title: 'Persisted link', url: 'https://persisted.example', tags: ['saved', 'api'] })] }),
    );

    const firstRender = render(<App />);
    await waitFor(() => expect(screen.getByRole('link', { name: /persisted link/i })).toBeTruthy());
    firstRender.unmount();

    fetchMock.mockResolvedValueOnce(jsonResponse({ bookmarks: [bookmark({ id: 2, title: 'After remount' })] }));
    render(<App />);

    await waitFor(() => expect(screen.getByRole('link', { name: /after remount/i })).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new Headers(fetchMock.mock.calls[1][1]?.headers).get('authorization')).toBe('Bearer persisted-token');
  });

  it('displays readable inline API errors and retries the bookmark load', async () => {
    const fetchMock = mockBookmarkResponses(
      jsonResponse({ error: { code: 'unauthorized', message: 'Token is invalid' } }, { status: 401 }),
      jsonResponse({ bookmarks: [bookmark({ title: 'Loaded after retry' })] }),
    );
    window.localStorage.setItem(authTokenStorageKey, 'bad-token');

    render(<App />);

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Token is invalid'));
    expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => expect(screen.getByRole('link', { name: /loaded after retry/i })).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('clears an invalid token so a different token can be entered', async () => {
    const fetchMock = mockBookmarkResponses(
      jsonResponse({ error: { code: 'unauthorized', message: 'Unauthorized token' } }, { status: 401 }),
      jsonResponse({ bookmarks: [bookmark({ title: 'Recovered bookmark' })] }),
    );
    window.localStorage.setItem(authTokenStorageKey, 'expired-token');

    render(<App />);

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Unauthorized token'));
    fireEvent.click(screen.getByRole('button', { name: /change token/i }));

    expect(window.localStorage.getItem(authTokenStorageKey)).toBeNull();
    expect(screen.getByRole('heading', { name: /enter your api token/i })).toBeTruthy();

    await saveToken('fresh-token');

    await waitFor(() => expect(screen.getByRole('link', { name: /recovered bookmark/i })).toBeTruthy());
    expect(new Headers(fetchMock.mock.calls[1][1]?.headers).get('authorization')).toBe('Bearer fresh-token');
    expect(window.localStorage.getItem(authTokenStorageKey)).toBe('fresh-token');
  });
});
