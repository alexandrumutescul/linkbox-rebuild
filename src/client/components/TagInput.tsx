import { KeyboardEvent, useState } from 'react';

interface TagInputProps {
  id: string;
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

function normaliseTag(tag: string): string {
  return tag.trim();
}

export function TagInput({ id, label, tags, onChange, disabled = false }: TagInputProps) {
  const [draft, setDraft] = useState('');

  const addDraft = () => {
    const next = normaliseTag(draft);
    if (!next || tags.some((tag) => tag.toLocaleLowerCase() === next.toLocaleLowerCase())) {
      setDraft('');
      return;
    }

    onChange([...tags, next]);
    setDraft('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addDraft();
    }
  };

  return (
    <div className="field tag-editor">
      <label htmlFor={id}>{label}</label>
      <div className="tag-input-row">
        <input
          id={id}
          value={draft}
          onBlur={addDraft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Add a tag and press Enter"
          disabled={disabled}
        />
        <button className="button button-secondary" type="button" onClick={addDraft} disabled={disabled || !draft.trim()}>
          Add tag
        </button>
      </div>
      {tags.length > 0 ? (
        <ul className="tag-list editable-tags" aria-label={`${label} selected`}>
          {tags.map((tag) => (
            <li key={tag}>
              <span>{tag}</span>
              <button type="button" onClick={() => onChange(tags.filter((item) => item !== tag))} disabled={disabled} aria-label={`Remove ${tag}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
