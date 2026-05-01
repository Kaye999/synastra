import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { POSTS, getPost } from '@/lib/field-notes/posts';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: PageProps,
): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: 'Field Note Not Found' };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, images: [post.hero] },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function FieldNotePage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const traditions = Array.isArray(post.tradition) ? post.tradition : [post.tradition];

  return (
    <main className="min-h-svh bg-[#0A0E1A] text-[#FCFAF6]">
      <article className="relative">
        {/* Hero */}
        <div className="relative h-[42svh] w-full overflow-hidden md:h-[55svh]">
          <img src={post.hero} alt="" className="h-full w-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(10,14,26,0.15) 0%, rgba(10,14,26,0.55) 60%, #0A0E1A 100%)',
            }}
          />
        </div>

        <div className="mx-auto -mt-32 max-w-2xl px-6 md:-mt-40 md:px-0">
          <header className="relative mb-12">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-[#C8A052]">
              {post.season ?? post.cycle}
              {post.hemisphere && post.hemisphere !== 'both' && (
                <span className="text-white/40"> · {post.hemisphere}ern hemisphere</span>
              )}
            </p>
            <h1 className="font-display text-3xl font-medium leading-tight tracking-tight md:text-4xl">
              {post.title}
            </h1>
            <p className="mt-3 text-sm uppercase tracking-wider text-white/45">
              {formatDate(post.publishedAt)}
            </p>
          </header>

          <div className="space-y-6 text-[17px] leading-[1.78] text-white/85 md:text-[18px]">
            {post.body.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <aside className="my-14 rounded-2xl border border-[#C8A052]/30 bg-[#C8A052]/[0.04] p-6">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[#C8A052]">
              Practice
            </p>
            <p className="text-[16px] leading-relaxed italic text-white/85">
              {post.practice}
            </p>
          </aside>

          <footer className="mt-12 border-t border-white/10 pt-8 text-sm text-white/55">
            <p className="mb-3 text-xs uppercase tracking-wider text-white/40">
              Tradition · {traditions.join(', ')}
            </p>
            {post.references && post.references.length > 0 && (
              <ul className="space-y-1.5 text-[13px] text-white/45">
                {post.references.map((r) => (
                  <li key={r.label}>{r.label}</li>
                ))}
              </ul>
            )}
          </footer>

          <nav className="my-14 flex items-baseline gap-4 text-xs uppercase tracking-wider text-white/45">
            <Link href="/field-notes" className="hover:text-white">← Field notes</Link>
            <Link href="/now" className="hover:text-white">/now</Link>
          </nav>
        </div>
      </article>
    </main>
  );
}
