import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Clock,
  Calendar,
  User,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Share2,
  Tag,
  ShieldCheck,
  Zap,
  Code,
  Sparkles,
  Info,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  UploadCloud,
  Wrench,
} from 'lucide-react';
import { ARTICLES, Article } from '../data/articles';
import { useToast } from '../components/Toast';
import { useSeo } from '../lib/useSeo';

export const ArticlesPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // If a slug is present in URL, render the single article reader view
  if (slug) {
    const article = ARTICLES.find((a) => a.slug === slug);
    if (!article) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white">Article Not Found</h1>
          <p className="text-zinc-400 max-w-md mx-auto">
            The article you are looking for may have been moved or updated. Browse our knowledge base for the latest guides.
          </p>
          <Link
            to="/articles"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Articles
          </Link>
        </div>
      );
    }

    return <ArticleDetailView article={article} />;
  }

  // Otherwise render the full articles index
  return <ArticlesCatalogView />;
};

// ==========================================
// 1. ARTICLES CATALOG / KNOWLEDGE BASE VIEW
// ==========================================
const ArticlesCatalogView: React.FC = () => {
  useSeo({
    title: 'Knowledge Base & Guides',
    description: 'Learn about direct image linking, Markdown embeds, privacy delete tokens, and the developer REST API with Image To URL.',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Guides', 'Privacy', 'Performance', 'Developer', 'Cheatsheet'];

  const filteredArticles = useMemo(() => {
    return ARTICLES.filter((article) => {
      const matchesCategory =
        selectedCategory === 'All' || article.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesSearch =
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q) ||
        article.tags.some((t) => t.toLowerCase().includes(q)) ||
        article.content.some(
          (c) =>
            c.sectionTitle.toLowerCase().includes(q) ||
            c.paragraphs?.some((p) => p.toLowerCase().includes(q))
        );

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const featuredArticle = useMemo(() => {
    return ARTICLES.find((a) => a.featured) || ARTICLES[0];
  }, []);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Guides':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Privacy':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Performance':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Developer':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'Cheatsheet':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide uppercase">
          <BookOpen className="w-3.5 h-3.5" />
          Image To URL Knowledge Base & Guides
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Image Hosting, Embeds & Developer Guides
        </h1>
        <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
          Master direct image linking, Markdown embeddings for GitHub & Reddit, ephemeral privacy with delete tokens, WebP optimization, and automated REST APIs.
        </p>
      </div>

      {/* Featured Article Banner (shown when no search filter active) */}
      {!searchQuery && selectedCategory === 'All' && featuredArticle && (
        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-zinc-900/90 to-zinc-950 p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500 text-white shadow-sm">
                  <Sparkles className="w-3 h-3" /> Featured Guide
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(featuredArticle.category)}`}>
                  {featuredArticle.category}
                </span>
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {featuredArticle.readTime}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
                <Link
                  to={`/articles/${featuredArticle.slug}`}
                  className="hover:text-indigo-400 transition-colors"
                >
                  {featuredArticle.title}
                </Link>
              </h2>

              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed line-clamp-3">
                {featuredArticle.excerpt}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                {featuredArticle.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800/80 text-zinc-400 border border-zinc-700/50"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <Link
                to={`/articles/${featuredArticle.slug}`}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25 group"
              >
                <span>Read Full Article</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 font-medium text-sm transition-colors border border-zinc-700/60"
              >
                <UploadCloud className="w-4 h-4 text-indigo-400" />
                <span>Try Direct Upload</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles, codes, WebP, Markdown..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Results Summary */}
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
          <span>
            Showing <strong className="text-zinc-200">{filteredArticles.length}</strong> {filteredArticles.length === 1 ? 'article' : 'articles'}
            {searchQuery && ` matching "${searchQuery}"`}
            {selectedCategory !== 'All' && ` in ${selectedCategory}`}
          </span>
          {(searchQuery || selectedCategory !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="text-indigo-400 hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center space-y-4">
          <BookOpen className="w-10 h-10 text-zinc-500 mx-auto" />
          <h3 className="text-lg font-semibold text-white">No articles match your query</h3>
          <p className="text-sm text-zinc-400 max-w-sm mx-auto">
            Try searching for something else like "markdown", "webp", "api", or "privacy".
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
          >
            Show All Articles
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <article
              key={article.slug}
              className="group flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700/80 transition-all duration-200 p-6 shadow-sm hover:shadow-xl hover:shadow-black/40"
            >
              <div className="space-y-4">
                {/* Meta Header */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(
                      article.category
                    )}`}
                  >
                    {article.category}
                  </span>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">
                  <Link to={`/articles/${article.slug}`}>{article.title}</Link>
                </h3>

                {/* Excerpt */}
                <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">
                  {article.excerpt}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {article.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-400"
                    >
                      #{tag}
                    </span>
                  ))}
                  {article.tags.length > 3 && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-zinc-800/40 text-zinc-400">
                      +{article.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-6 mt-6 border-t border-zinc-800/60 flex items-center justify-between">
                <span className="text-xs text-zinc-400">{article.date}</span>
                <Link
                  to={`/articles/${article.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors"
                >
                  Read Article
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Bottom Knowledge Callout */}
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-xl font-bold text-white">Need a fast image link right now?</h3>
          <p className="text-sm text-zinc-400 max-w-lg">
            Upload your screenshot or photo in one click. Receive direct URLs, Markdown codes, HTML tags, and BBCode instantly.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-600/20"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Image
          </Link>
          <Link
            to="/tools"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-sm transition-colors border border-zinc-700/60"
          >
            <Wrench className="w-4 h-4" />
            WebP Converter
          </Link>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. ARTICLE DETAIL READER VIEW
// ==========================================
interface ArticleDetailViewProps {
  article: Article;
}

const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({ article }) => {
  useSeo({
    title: article.title,
    description: article.excerpt,
  });

  const { showToast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string, key?: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'success');
    if (key) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const copyArticleLink = () => {
    copyToClipboard(window.location.href, 'Article link');
  };

  // Find 2 related articles in the same category or other articles
  const relatedArticles = useMemo(() => {
    return ARTICLES.filter((a) => a.slug !== article.slug)
      .sort((a, b) => (a.category === article.category ? -1 : 1))
      .slice(0, 2);
  }, [article]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/articles"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all articles
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={copyArticleLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share Article
          </button>
        </div>
      </div>

      {/* Article Header */}
      <header className="space-y-5 border-b border-zinc-800/80 pb-8">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {article.category}
          </span>
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {article.readTime}
          </span>
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {article.date}
          </span>
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {article.author}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
          {article.title}
        </h1>

        <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-normal">
          {article.excerpt}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {article.tags.map((t) => (
            <span
              key={t}
              className="text-xs px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-400 border border-zinc-800"
            >
              #{t}
            </span>
          ))}
        </div>
      </header>

      {/* Article Body Content */}
      <main className="space-y-12">
        {article.content.map((section, idx) => (
          <section key={idx} className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-indigo-400 font-mono text-base font-normal">#{idx + 1}</span>
              {section.sectionTitle}
            </h2>

            {section.paragraphs?.map((p, pIdx) => (
              <p key={pIdx} className="text-zinc-300 text-base leading-relaxed">
                {p}
              </p>
            ))}

            {/* Callout Box */}
            {section.callout && (
              <div
                className={`rounded-2xl p-4 sm:p-5 border flex items-start gap-3.5 my-4 ${
                  section.callout.type === 'security'
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : section.callout.type === 'tip'
                    ? 'bg-indigo-950/20 border-indigo-500/30 text-indigo-200'
                    : section.callout.type === 'warning'
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-200'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {section.callout.type === 'security' && (
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  )}
                  {section.callout.type === 'tip' && (
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  )}
                  {section.callout.type === 'warning' && (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                  {section.callout.type === 'info' && (
                    <Info className="w-5 h-5 text-cyan-400" />
                  )}
                </div>
                <div className="text-sm leading-relaxed">{section.callout.text}</div>
              </div>
            )}

            {/* Interactive Code Block (Single) */}
            {section.codeBlock && (
              <div className="my-5 rounded-2xl border border-zinc-800 bg-[#0c0c0e] overflow-hidden shadow-xl">
                <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 text-xs">
                  <div className="flex items-center gap-2 text-zinc-300 font-mono">
                    <Code className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{section.codeBlock.title || section.codeBlock.language}</span>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(section.codeBlock!.code, 'Code snippet', `block-${idx}`)
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                  >
                    {copiedKey === `block-${idx}` ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 sm:p-5 text-xs sm:text-sm font-mono text-zinc-200 overflow-x-auto leading-relaxed">
                  <code>{section.codeBlock.code}</code>
                </pre>
              </div>
            )}

            {/* Interactive Code Blocks (Multiple) */}
            {section.codeBlocks?.map((cb, cbIdx) => {
              const codeKey = `blocks-${idx}-${cbIdx}`;
              return (
                <div key={cbIdx} className="my-5 rounded-2xl border border-zinc-800 bg-[#0c0c0e] overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 text-xs">
                    <div className="flex items-center gap-2 text-zinc-300 font-mono">
                      <Code className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{cb.title || cb.language}</span>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(cb.code, 'Code snippet', codeKey)
                      }
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                    >
                      {copiedKey === codeKey ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 sm:p-5 text-xs sm:text-sm font-mono text-zinc-200 overflow-x-auto leading-relaxed">
                    <code>{cb.code}</code>
                  </pre>
                </div>
              );
            })}

            {/* List Items */}
            {section.listItems && (
              <ul className="space-y-2.5 my-3 pl-1">
                {section.listItems.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2.5 text-zinc-300 text-sm sm:text-base">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </main>

      {/* Practical Action Box */}
      <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 via-zinc-900 to-zinc-950 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5 text-center sm:text-left">
          <h4 className="text-lg font-bold text-white">Ready to test these techniques?</h4>
          <p className="text-xs sm:text-sm text-zinc-400">
            Upload an image to generate live direct links, Markdown snippets, and HTML embeds immediately.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm transition-colors shadow-lg shadow-indigo-600/20"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Now
          </Link>
          <Link
            to="/tools"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs sm:text-sm transition-colors border border-zinc-700"
          >
            <Wrench className="w-4 h-4" />
            Image Tools
          </Link>
        </div>
      </div>

      {/* Related Articles */}
      <div className="pt-8 border-t border-zinc-800/80 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Recommended Reading</h3>
          <Link to="/articles" className="text-xs font-semibold text-indigo-400 hover:underline">
            View all articles
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {relatedArticles.map((rel) => (
            <Link
              key={rel.slug}
              to={`/articles/${rel.slug}`}
              className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-medium">
                  {rel.category}
                </span>
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">
                  {rel.title}
                </h4>
                <p className="text-xs text-zinc-400 line-clamp-2">{rel.excerpt}</p>
              </div>
              <div className="text-xs text-indigo-400 flex items-center gap-1 font-medium">
                Read guide <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
