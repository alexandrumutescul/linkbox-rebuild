export default function App() {
  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">Linkbox</p>
        <h1 id="page-title">Save, organize, and revisit your links.</h1>
        <p className="intro">
          A lightweight bookmark workspace is taking shape. The Express API and
          React client are ready to run together from one Node process.
        </p>
        <div className="status-card" role="status">
          <span className="status-dot" aria-hidden="true" />
          <span>Application shell ready</span>
        </div>
      </section>
    </main>
  );
}
