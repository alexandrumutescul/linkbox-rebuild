import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from '../../src/client/App';
import { authTokenStorageKey } from '../../src/client/hooks/useAuthToken';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
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

function mockResponses(...responses: Response[]) {
  const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
  responses.forEach((response) => fetchMock.mockResolvedValueOnce(response));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function fillCreateForm() {
  fireEvent.change(screen.getByLabelText(/^url$/i), { target: { value: 'https://new.example' } });
  fireEvent.change(screen.getByLabelText(/^title$/i), { target: { value: 'New bookmark' } });
  fireEvent.change(screen.getByLabelText(/^notes$/i), { target: { value: 'Fresh notes' } });
  fireEvent.change(screen.getByLabelText(/^tags$/i), { target: { value: 'fresh' } });
  fireEvent.click(screen.getByRole('button', { name: /add tag/i }));
}

describe('bookmark CRUD UI', () => {
  beforeEach(() => {
    window.localStorage.setItem(authTokenStorageKey, 'test-token');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('saves a new bookmark and shows it at the top of the list', async () => {
    const existing = bookmark({ id: 1, title: 'Older bookmark' });
    const created = bookmark({ id: 2, title: 'New bookmark', url: 'https://new.example', notes: 'Fresh notes', tags: ['fresh'] });
    const fetchMock = mockResponses(
      jsonResponse({ bookmarks: [existing] }),
      jsonResponse({ bookmark: created }, { status: 201 }),
      jsonResponse({ bookmarks: [created, existing] }),
    );

    render(<App />);
    await waitFor(() => expect(screen.getByRole('link', { name: /older bookmark/i })).toBeTruthy());

    fillCreateForm();
    fireEvent.click(screen.getByRole('button', { name: /save bookmark/i }));

    await waitFor(() => expect(screen.getByRole('link', { name: /new bookmark/i })).toBeTruthy());
    const links = within(screen.getByRole('list', { name: /bookmarks/i })).getAllByRole('link');
    expect(links[0].textContent).toBe('New bookmark');
    expect(fetchMock.mock.calls[1][0]).toBe('/api/bookmarks');
    expect(fetchMock.mock.calls[1][1]?.method).toBe('POST');
  });

  it('edits an existing bookmark and updates the visible card', async () => {
    const original = bookmark({ title: 'Original title', tags: ['old'] });
    const updated = bookmark({ title: 'Updated title', tags: ['new'] });
    mockResponses(
      jsonResponse({ bookmarks: [original] }),
      jsonResponse({ bookmark: updated }),
      jsonResponse({ bookmarks: [updated] }),
    );

    render(<App />);
    await waitFor(() => expect(screen.getByRole('link', { name: /original title/i })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    const dialog = screen.getByRole('dialog', { name: /edit bookmark/i });
    fireEvent.change(within(dialog).getByLabelText(/^title$/i), { target: { value: 'Updated title' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /remove old/i }));
    fireEvent.change(within(dialog).getByLabelText(/^tags$/i), { target: { value: 'new' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /add tag/i }));
    fireEvent.click(within(dialog).getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(screen.getByRole('link', { name: /updated title/i })).toBeTruthy());
    expect(screen.queryByRole('link', { name: /original title/i })).toBeNull();
    expect(screen.getByText('new')).toBeTruthy();
  });

  it('deletes a bookmark only after confirmation', async () => {
    const doomed = bookmark({ title: 'Delete me' });
    const fetchMock = mockResponses(
      jsonResponse({ bookmarks: [doomed] }),
      new Response(null, { status: 204 }),
      jsonResponse({ bookmarks: [] }),
    );

    render(<App />);
    await waitFor(() => expect(screen.getByRole('link', { name: /delete me/i })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(screen.getByText(/delete “delete me”/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

    await waitFor(() => expect(screen.queryByRole('link', { name: /delete me/i })).toBeNull());
    expect(screen.getByText(/no bookmarks saved yet/i)).toBeTruthy();
    expect(fetchMock.mock.calls[1][0]).toBe('/api/bookmarks/1');
    expect(fetchMock.mock.calls[1][1]?.method).toBe('DELETE');
  });

  it('keeps delete confirmation open and shows an error when deletion fails', async () => {
    const doomed = bookmark({ title: 'Delete me' });
    const fetchMock = mockResponses(
      jsonResponse({ bookmarks: [doomed] }),
      jsonResponse({ error: { message: 'Delete failed' } }, { status: 500 }),
      new Response(null, { status: 204 }),
      jsonResponse({ bookmarks: [] }),
    );

    render(<App />);
    await waitFor(() => expect(screen.getByRole('link', { name: /delete me/i })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Delete failed'));
    expect(screen.getByText(/delete “delete me”/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /confirm delete/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /delete me/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

    await waitFor(() => expect(screen.queryByRole('link', { name: /delete me/i })).toBeNull());
    expect(screen.getByText(/no bookmarks saved yet/i)).toBeTruthy();
    expect(fetchMock.mock.calls[1][1]?.method).toBe('DELETE');
    expect(fetchMock.mock.calls[2][1]?.method).toBe('DELETE');
  });

  it('shows field-level feedback for invalid create and edit submissions', async () => {
    mockResponses(jsonResponse({ bookmarks: [bookmark()] }));

    render(<App />);
    await waitFor(() => expect(screen.getByRole('link', { name: /example bookmark/i })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /save bookmark/i }));
    expect(screen.getByText(/enter a bookmark url/i)).toBeTruthy();
    expect(screen.getByText(/enter a bookmark title/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    const dialog = screen.getByRole('dialog', { name: /edit bookmark/i });
    fireEvent.change(within(dialog).getByLabelText(/^url$/i), { target: { value: 'not-a-url' } });
    fireEvent.change(within(dialog).getByLabelText(/^title$/i), { target: { value: '' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /save changes/i }));

    expect(within(dialog).getByText(/enter a valid url/i)).toBeTruthy();
    expect(within(dialog).getByText(/enter a bookmark title/i)).toBeTruthy();
    expect(screen.getByRole('dialog', { name: /edit bookmark/i })).toBeTruthy();
  });
});
