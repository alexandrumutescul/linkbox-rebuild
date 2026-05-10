import type { BookmarkDto } from '../../shared/apiTypes';
import { InlineError } from './InlineError';
import { LoadingState } from './LoadingState';
import { BookmarkCard } from './BookmarkCard';

interface BookmarkListProps {
  bookmarks: BookmarkDto[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  onRetry: () => void;
  onEdit: (bookmark: BookmarkDto) => void;
  onDelete: (id: number) => Promise<void>;
}

export function BookmarkList({ bookmarks, isLoading, isLoaded, error, onRetry, onEdit, onDelete }: BookmarkListProps) {
  if (isLoading && !isLoaded) {
    return <LoadingState message="Loading bookmarks…" />;
  }

  if (error) {
    return (
      <div className="error-panel">
        <InlineError message={error} />
        <button className="button button-primary" type="button" onClick={onRetry}>Retry</button>
      </div>
    );
  }

  if (isLoaded && bookmarks.length === 0) {
    return <p className="empty-state">No bookmarks saved yet.</p>;
  }

  return (
    <ul className="bookmark-list" aria-label="Bookmarks">
      {bookmarks.map((bookmark) => (
        <li key={bookmark.id}>
          <BookmarkCard bookmark={bookmark} onEdit={onEdit} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  );
}
