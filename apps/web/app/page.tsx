import { SiteNav } from "@/components/SiteNav";
import { UploadHero } from "@/components/UploadHero";

export default function HomePage() {
  return (
    <main className="home">
      <div className="home-atmosphere" aria-hidden />
      <div className="home-top">
        <SiteNav />
      </div>
      <section className="home-hero">
        <p className="brand-hero">SplitShot</p>
        <h1>Fair splits from a receipt photo.</h1>
        <p className="lede">
          Snap the check, let AI pull the line items, tap who ordered what, and
          share the link.
        </p>
        <UploadHero />
      </section>
    </main>
  );
}
