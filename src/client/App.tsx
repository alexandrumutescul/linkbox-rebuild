import { useState } from 'react';
import type { BookmarkDto, CreateBookmarkRequest, PatchBookmarkRequest } from '../shared/apiTypes';
import { AuthTokenGate } from './components/AuthTokenGate';
import { BookmarkForm } from './components/BookmarkForm';
import { BookmarkList } from './components/BookmarkList';
import { Button } from './components/Button';
import { EditBookmarkDialog } from './components/EditBookmarkDialog';
import { useAuthToken } from './hooks/useAuthToken';
import { useBookmarks } from './hooks/useBookmarks';

export default function App() {
  const auth = useAuthToken();
  const bookmarksState = useBookmarks(auth.token);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkDto | null>(null);

  const create = async (bookmark: CreateBookmarkRequest) => {
    await bookmarksState.create(bookmark);
  };

  const update = async (id: number, bookmark: PatchBookmarkRequest) => {
    await bookmarksState.update(id, bookmark);
  };

  return (
    <main className="app-shell">
      <AuthTokenGate token={auth.token} onSaveToken={auth.saveToken}>
        <section className="hero" aria-labelledby="app-title">
          <div className="app-header">
            <div>
              <p className="eyebrow">Linkbox</p>
              <h1 id="app-title">Your bookmarks</h1>
            </div>
            <Button variant="secondary" onClick={auth.clearToken}>Change token</Button>
          </div>

          <BookmarkForm onSave={create} />

          <section className="bookmarks-section" aria-labelledby="bookmark-list-title">
            <div className="section-header">
              <h2 id="bookmark-list-title">Saved bookmarks</h2>
              {bookmarksState.isLoading && bookmarksState.isLoaded ? <span className="subtle-status">Refreshing…</span> : null}
            </div>
            <BookmarkList
              bookmarks={bookmarksState.bookmarks}
              isLoading={bookmarksState.isLoading}
              isLoaded={bookmarksState.isLoaded}
              error={bookmarksState.error}
              onRetry={bookmarksState.reload}
              onEdit={setEditingBookmark}
              onDelete={bookmarksState.delete}
            />
          </section>

          <EditBookmarkDialog bookmark={editingBookmark} onClose={() => setEditingBookmark(null)} onSave={update} />
        </section>
      </AuthTokenGate>
    </main>
  );
}
