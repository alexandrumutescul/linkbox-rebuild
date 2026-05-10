import { type FormEvent, type ReactNode, useState } from 'react';
import { Button } from './Button';

interface AuthTokenGateProps {
  token: string | null;
  onSaveToken: (token: string) => void;
  children: ReactNode;
}

export function AuthTokenGate({ token, onSaveToken, children }: AuthTokenGateProps) {
  const [draftToken, setDraftToken] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSaveToken(draftToken);
    setDraftToken('');
  }

  if (token) {
    return <>{children}</>;
  }

  return (
    <section className="auth-card" aria-labelledby="auth-title">
      <p className="eyebrow">Protected access</p>
      <h1 id="auth-title">Enter your API token</h1>
      <p className="lede">Bookmarks are protected. Paste your bearer token to load your saved links.</p>
      <form className="token-form" onSubmit={handleSubmit}>
        <label htmlFor="api-token">API token</label>
        <input
          id="api-token"
          name="api-token"
          type="password"
          autoComplete="off"
          value={draftToken}
          onChange={(event) => setDraftToken(event.target.value)}
          required
        />
        <Button type="submit">Save token</Button>
      </form>
    </section>
  );
}
