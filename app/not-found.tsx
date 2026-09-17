import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="shell not-found">
      <span className="eyebrow">404 / NOT FOUND</span>
      <h1>This page is under lock and key.</h1>
      <p>Let’s get you back to creating something secure.</p>
      <Link className="button-primary" href="/generate/">
        Open the generator
      </Link>
    </main>
  );
}
