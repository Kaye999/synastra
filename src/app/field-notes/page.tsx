import Link from 'next/link';
import type { Metadata } from 'next';
import { POSTS } from '@/lib/field-notes/posts';

export const metadata: Metadata = {
  title: 'Field Notes',
  description:
    'Slow essays on cycles — seasonal, lunar, agricultural — and the ancestral calendars they belong to. A companion layer to your chart.',
};

export default function FieldNotesIndexPage() {
  const posts = [...POSTS].sort(
    (a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt),
  );

  return (
    <main className="min-h-svh bg-[#0A0E1A] text-[#FCFAF6]">
      <div className="mx-auto max-w-5xl px-6 py-16 md:px-10 md:py-24">
        <header className="mb-14 max-w-2xl">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-[#C8A052]">
            Synastra · Field Notes
          </p>
          <h1 className="font-display text-4xl font-medium leading-tight tracking-tight md:text-5xl">
            Slow essays on cycles.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/65">
            A companion layer to the chart — seasonal, lunar, agricultural — and the
            ancestral calendars they belong to. Read at the pace they were written.
          </p>
        </header>

        <ul className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/field-notes/${post.slug}`}
                className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition hover:border-[#C8A052]/40 hover:bg-white/[0.04]"
              >
                <div className="aspect-[16/9] overflow-hidden bg-black">
                  <img
                    src={post.hero}
                    alt=""
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-[#C8A052]/85">
                    {post.season ?? post.cycle}
                  </p>
                  <h2 className="font-display text-xl font-medium leading-snug">
                    {post.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <footer className="mt-20 border-t border-white/10 pt-8 text-xs uppercase tracking-wider text-white/40">
          <Link href="/" className="hover:text-white">← Synastra home</Link>
          <span className="mx-3">·</span>
          <Link href="/now" className="hover:text-white">/now</Link>
        </footer>
      </div>
    </main>
  );
}
