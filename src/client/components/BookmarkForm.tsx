import { FormEvent, useState } from 'react';
import type { CreateBookmarkRequest } from '../../shared/apiTypes';
import { ApiClientError } from '../api/client';
import { TagInput } from './TagInput';

export interface BookmarkFormValues {
  url: string;
  title: string;
  notes: string;
  tags: string[];
}

export interface BookmarkFieldErrors {
  url?: string;
  title?: string;
  form?: string;
}

interface BookmarkFormProps {
  onSave: (bookmark: CreateBookmarkRequest) => Promise<void>;
}

export function validateBookmark(values: BookmarkFormValues): BookmarkFieldErrors {
  const errors: BookmarkFieldErrors = {};
  const url = values.url.trim();
  const title = values.title.trim();

  if (!url) {
    errors.url = 'Enter a bookmark URL.';
  } else {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        errors.url = 'Enter a valid http or https URL.';
      }
    } catch {
      errors.url = 'Enter a valid URL.';
    }
  }

  if (!title) {
    errors.title = 'Enter a bookmark title.';
  }

  return errors;
}

export function toCreateRequest(values: BookmarkFormValues): CreateBookmarkRequest {
  return {
    url: values.url.trim(),
    title: values.title.trim(),
    notes: values.notes.trim() ? values.notes.trim() : null,
    tags: values.tags,
  };
}

const initialValues: BookmarkFormValues = { url: '', title: '', notes: '', tags: [] };

function serverErrorMessage(cause: unknown): string {
  if (cause instanceof ApiClientError && cause.details && cause.details.length > 0) {
    return cause.details.join(' ');
  }
  return cause instanceof Error ? cause.message : 'Unable to save bookmark.';
}

export function BookmarkForm({ onSave }: BookmarkFormProps) {
  const [values, setValues] = useState<BookmarkFormValues>(initialValues);
  const [errors, setErrors] = useState<BookmarkFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateBookmark(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(toCreateRequest(values));
      setValues(initialValues);
      setErrors({});
    } catch (cause: unknown) {
      setErrors({ form: serverErrorMessage(cause) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="bookmark-form" onSubmit={submit} noValidate aria-label="Add bookmark">
      <h2>Add bookmark</h2>
      {errors.form ? <p className="inline-error" role="alert">{errors.form}</p> : null}
      <div className="field">
        <label htmlFor="new-bookmark-url">URL</label>
        <input id="new-bookmark-url" value={values.url} onChange={(event) => setValues({ ...values, url: event.target.value })} aria-invalid={errors.url ? 'true' : 'false'} aria-describedby={errors.url ? 'new-bookmark-url-error' : undefined} disabled={isSubmitting} />
        {errors.url ? <p className="field-error" id="new-bookmark-url-error">{errors.url}</p> : null}
      </div>
      <div className="field">
        <label htmlFor="new-bookmark-title">Title</label>
        <input id="new-bookmark-title" value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} aria-invalid={errors.title ? 'true' : 'false'} aria-describedby={errors.title ? 'new-bookmark-title-error' : undefined} disabled={isSubmitting} />
        {errors.title ? <p className="field-error" id="new-bookmark-title-error">{errors.title}</p> : null}
      </div>
      <div className="field">
        <label htmlFor="new-bookmark-notes">Notes</label>
        <textarea id="new-bookmark-notes" value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} disabled={isSubmitting} />
      </div>
      <TagInput id="new-bookmark-tags" label="Tags" tags={values.tags} onChange={(tags) => setValues({ ...values, tags })} disabled={isSubmitting} />
      <button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save bookmark'}</button>
    </form>
  );
}
