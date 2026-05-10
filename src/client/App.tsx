import { AuthTokenGate } from './components/AuthTokenGate';
import { Button } from './components/Button';
import { InlineError } from './components/InlineError';
import { LoadingState } from './components/LoadingState';
import { useAuthToken } from './hooks/useAuthToken';
import { useBookmarks } from './hooks/useBookmarks';

export default function App() {
  const auth = useAuthToken();
  const bookmarksState = useBookmarks(auth.token);

  return (
    <main className="app-shell">
      <AuthTokenGate token={auth.token} onSaveToken={auth.saveToken}>
        <section className="hero" aria-labelledby="app-title">
          <div className="app-header">
            <div>
              <p className="eyebrow">Linkbox</p>
              <h1 id="app-title">Your bookmarks</h1>
            </div>
            <Button variant="secondary" onClick={auth.clearToken}>
              Change token
            </Button>
          </div>

          {bookmarksState.isLoading ? <LoadingState message="Loading bookmarks…" /> : null}

          {bookmarksState.error ? (
            <div className="error-panel">
              <InlineError message={bookmarksState.error} />
              <div className="button-row">
                <Button onClick={bookmarksState.reload}>Retry</Button>
                <Button variant="secondary" onClick={auth.clearToken}>
                  Change token
                </Button>
              </div>
            </div>
          ) : null}

          {!bookmarksState.isLoading && !bookmarksState.error && bookmarksState.isLoaded ? (
            bookmarksState.bookmarks.length > 0 ? (
              <ul className="bookmark-list" aria-label="Bookmarks">
                {bookmarksState.bookmarks.map((bookmark) => (
                  <li className="bookmark-card" key={bookmark.id}>
                    <a href={bookmark.url}>{bookmark.title}</a>
                    {bookmark.notes ? <p>{bookmark.notes}</p> : null}
                    {bookmark.tags.length > 0 ? (
                      <ul className="tag-list" aria-label={`${bookmark.title} tags`}>
                        {bookmark.tags.map((tag) => (
                          <li key={tag}>{tag}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No bookmarks saved yet.</p>
            )
          ) : null}
        </section>
      </AuthTokenGate>
    </main>
  );
}
