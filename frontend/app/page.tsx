import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-black text-zinc-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-100px,rgba(59,130,246,0.1),transparent_60%)]" />

      <section className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
          NullTrace
        </h1>
        <p className="mt-4 max-w-xl text-lg text-zinc-400">
          Share opinions anonymously with trust and privacy.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/feedback"
            className="group inline-flex items-center justify-center rounded-xl bg-blue-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
          >
            Give Feedback
          </Link>
          <Link
            href="/opinions"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-[#1a1a1a] px-6 py-3 text-sm font-medium text-zinc-100 shadow-lg transition-all duration-200 hover:border-cyan-500/50 hover:bg-[#222] hover:shadow-cyan-500/10"
          >
            View Public Opinions
          </Link>
        </div>
      </section>
    </main>
  );
}
