import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-900 text-zinc-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-100px,rgba(120,119,198,0.15),transparent_60%)]" />

      <section className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">NullTrace</h1>
        <p className="mt-4 max-w-xl text-lg text-zinc-400">
          Share opinions anonymously with trust and privacy.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/feedback"
            className="inline-flex items-center justify-center rounded-md bg-zinc-100 px-5 py-3 text-sm font-medium text-black shadow-sm transition hover:bg-zinc-200"
          >
            Give Feedback
          </Link>
          <Link
            href="/opinions"
            className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-transparent px-5 py-3 text-sm font-medium text-zinc-100 shadow-sm transition hover:bg-zinc-900 hover:border-zinc-600"
          >
            View Public Opinions
          </Link>
        </div>
      </section>
    </main>
  );
}
