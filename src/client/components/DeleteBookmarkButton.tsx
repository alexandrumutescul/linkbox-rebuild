import { useState } from 'react';

interface DeleteBookmarkButtonProps {
  title: string;
  onDelete: () => Promise<void>;
}

export function DeleteBookmarkButton({ title, onDelete }: DeleteBookmarkButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onDelete();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete bookmark.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isConfirming) {
    return (
      <div className="delete-confirmation">
        <span>Delete “{title}”?</span>
        <button className="button button-danger" type="button" onClick={confirm} disabled={isDeleting}>
          {isDeleting ? 'Deleting…' : 'Confirm delete'}
        </button>
        <button className="button button-secondary" type="button" onClick={() => setIsConfirming(false)} disabled={isDeleting}>
          Cancel
        </button>
        {error ? <p className="field-error" role="alert">{error}</p> : null}
      </div>
    );
  }

  return (
    <>
      <button className="button button-danger" type="button" onClick={() => setIsConfirming(true)}>
        Delete
      </button>
      {error ? <p className="field-error" role="alert">{error}</p> : null}
    </>
  );
}
