import { FormEvent, useEffect, useState } from 'react';
import type { BookmarkDto, PatchBookmarkRequest } from '../../shared/apiTypes';
import { ApiClientError } from '../api/client';
import { BookmarkFieldErrors, BookmarkFormValues, toCreateRequest, validateBookmark } from './BookmarkForm';
import { TagInput } from './TagInput';

interface EditBookmarkDialogProps {
  bookmark: BookmarkDto | null;
  onClose: () => void;
  onSave: (id: number, bookmark: PatchBookmarkRequest) => Promise<void>;
}

function valuesFromBookmark(bookmark: BookmarkDto): BookmarkFormValues {
  return {
    url: bookmark.url,
    title: bookmark.title,
    notes: bookmark.notes ?? '',
    tags: bookmark.tags,
  };
}

function errorMessage(cause: unknown): string {
  if (cause instanceof ApiClientError && cause.details && cause.details.length > 0) {
    return cause.details.join(' ');
  }
  return cause instanceof Error ? cause.message : 'Unable to update bookmark.';
}

export function EditBookmarkDialog({ bookmark, onClose, onSave }: EditBookmarkDialogProps) {
  const [values, setValues] = useState<BookmarkFormValues>({ url: '', title: '', notes: '', tags: [] });
  const [errors, setErrors] = useState<BookmarkFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (bookmark) {
      setValues(valuesFromBookmark(bookmark));
      setErrors({});
      setIsSubmitting(false);
    }
  }, [bookmark]);

  if (!bookmark) {
    return null;
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateBookmark(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(bookmark.id, toCreateRequest(values));
      onClose();
    } catch (cause: unknown) {
      setErrors({ form: errorMessage(cause) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="edit-bookmark-title">
        <form onSubmit={submit} noValidate>
          <div className="dialog-header">
            <h2 id="edit-bookmark-title">Edit bookmark</h2>
            <button className="button button-secondary" type="button" onClick={onClose} disabled={isSubmitting}>Close</button>
          </div>
          {errors.form ? <p className="inline-error" role="alert">{errors.form}</p> : null}
          <div className="field">
            <label htmlFor="edit-bookmark-url">URL</label>
            <input id="edit-bookmark-url" value={values.url} onChange={(event) => setValues({ ...values, url: event.target.value })} aria-invalid={errors.url ? 'true' : 'false'} aria-describedby={errors.url ? 'edit-bookmark-url-error' : undefined} disabled={isSubmitting} />
            {errors.url ? <p className="field-error" id="edit-bookmark-url-error">{errors.url}</p> : null}
          </div>
          <div className="field">
            <label htmlFor="edit-bookmark-title-input">Title</label>
            <input id="edit-bookmark-title-input" value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} aria-invalid={errors.title ? 'true' : 'false'} aria-describedby={errors.title ? 'edit-bookmark-title-error' : undefined} disabled={isSubmitting} />
            {errors.title ? <p className="field-error" id="edit-bookmark-title-error">{errors.title}</p> : null}
          </div>
          <div className="field">
            <label htmlFor="edit-bookmark-notes">Notes</label>
            <textarea id="edit-bookmark-notes" value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} disabled={isSubmitting} />
          </div>
          <TagInput id="edit-bookmark-tags" label="Tags" tags={values.tags} onChange={(tags) => setValues({ ...values, tags })} disabled={isSubmitting} />
          <div className="button-row">
            <button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save changes'}</button>
            <button className="button button-secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          </div>
        </form>
      </section>
    </div>
  );
}
