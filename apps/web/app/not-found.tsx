import Link from "next/link";

export default function NotFound() {
  return (
    <main className="home">
      <section className="home-hero">
        <p className="brand-hero">SplitShot</p>
        <h1>That split link was not found.</h1>
        <p className="lede">It may have expired or the URL is incomplete.</p>
        <Link className="share-btn" href="/" style={{ display: "inline-block" }}>
          Start a new split
        </Link>
      </section>
    </main>
  );
}
