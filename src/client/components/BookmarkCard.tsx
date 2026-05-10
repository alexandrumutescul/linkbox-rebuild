import type { BookmarkDto } from '../../shared/apiTypes';
import { DeleteBookmarkButton } from './DeleteBookmarkButton';

interface BookmarkCardProps {
  bookmark: BookmarkDto;
  onEdit: (bookmark: BookmarkDto) => void;
  onDelete: (id: number) => Promise<void>;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function BookmarkCard({ bookmark, onEdit, onDelete }: BookmarkCardProps) {
  return (
    <article className="bookmark-card">
      <div className="card-main">
        <h3><a href={bookmark.url}>{bookmark.title}</a></h3>
        <p className="bookmark-url">{bookmark.url}</p>
        {bookmark.notes ? <p className="bookmark-notes">{bookmark.notes}</p> : null}
        {bookmark.tags.length > 0 ? (
          <ul className="tag-list" aria-label={`${bookmark.title} tags`}>
            {bookmark.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
        ) : null}
        <p className="metadata">Created {formatDate(bookmark.createdAt)} · Updated {formatDate(bookmark.updatedAt)}</p>
      </div>
      <div className="card-actions">
        <button className="button button-secondary" type="button" onClick={() => onEdit(bookmark)}>Edit</button>
        <DeleteBookmarkButton title={bookmark.title} onDelete={() => onDelete(bookmark.id)} />
      </div>
    </article>
  );
}
