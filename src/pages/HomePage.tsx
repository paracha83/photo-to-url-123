import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  Link as LinkIcon,
  Zap,
  Sliders,
  Shield,
  Code2,
  ChevronDown,
  Sparkles,
  HelpCircle,
  FileCheck,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { UploadDropzone } from '../components/UploadDropzone';
import { ImagePreviewCard } from '../components/ImagePreviewCard';
import { UploadResultCard } from '../components/UploadResultCard';
import { AdSlot } from '../components/AdSlot';
import { ImageRecord, UploadOptions } from '../types';
import { saveToHistory, removeFromHistory } from '../lib/storageHistory';
import { useToast } from '../components/Toast';
import { useSeo } from '../lib/useSeo';

export const HomePage: React.FC = () => {
  useSeo({
    title: '',
    description: 'Convert images into shareable URLs quickly and easily with Image To URL.',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadedImage, setUploadedImage] = useState<ImageRecord | null>(null);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);
  const { showToast } = useToast();

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setUploadedImage(null);
  };

  const handleUpload = async (
    fileToUpload: File | Blob,
    options: UploadOptions,
    isOptimized: boolean
  ) => {
    setIsUploading(true);
    setUploadProgress(15);

    try {
      const formData = new FormData();
      const filename = selectedFile?.name || 'image.webp';
      const uploadFilename = isOptimized
        ? filename.replace(/\.[^/.]+$/, '') + '.webp'
        : filename;

      formData.append('image', fileToUpload, uploadFilename);
      formData.append('expiration', options.expiration);

      setUploadProgress(45);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(85);

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Upload failed');
      }

      setUploadProgress(100);
      const record: ImageRecord = {
        ...data.image,
        deleteToken: data.deleteToken,
      };

      // Save to client history (saveToHistory stores deleteToken strictly in runtime session memory, not in localStorage)
      saveToHistory(record);
      setUploadedImage(record);
      showToast('Image uploaded and URL generated successfully!', 'success');
    } catch (err: unknown) {
      console.error('Upload error:', err);
      const msg = err instanceof Error ? err.message : 'Upload failed. Please check your connection.';
      showToast(msg, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadedImage(null);
    setUploadProgress(0);
  };

  const handleDeleted = () => {
    if (uploadedImage) {
      removeFromHistory(uploadedImage.id);
    }
    handleReset();
  };

  const faqs = [
    {
      q: 'What image formats are supported?',
      a: 'Image To URL supports JPG / JPEG, PNG, modern WEBP, and GIF files. Uploads are strictly verified using magic byte inspection.',
    },
    {
      q: 'What is the maximum image size?',
      a: 'The default maximum upload size is 10 MB per image. You can also use our built-in client-side optimizer to resize or compress large images before uploading.',
    },
    {
      q: 'Are uploaded images public?',
      a: 'Yes, any image uploaded to Image To URL receives a unique, unlisted direct URL. Anyone with the URL can access and view the image. Do not upload sensitive or private personal documents.',
    },
    {
      q: 'How long are images stored?',
      a: 'You can choose between 1 hour, 1 day, 7 days, 30 days, or Never (permanent retention). Expired images are automatically purged.',
    },
    {
      q: 'Can I delete my image after uploading?',
      a: 'Yes! When you upload an image, a secure cryptographic deletion token is assigned to your browser session. You can delete the image immediately from the result screen or from your "My Images" history page at any time.',
    },
    {
      q: 'Can I use the direct image URL on my website, blog, or markdown?',
      a: 'Absolutely. Image To URL provides ready-to-copy HTML <img> tags and Markdown embed codes with full CORS support and fast CDN caching.',
    },
  ];

  return (
    <div className="space-y-16 py-10 sm:py-16">
      {/* Hero Section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real Persistent Image Hosting</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Turn Images Into <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
            Shareable URLs
          </span>
        </h1>
        <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Upload an image and get a direct link in seconds. No account required, with instant HTML & Markdown embed codes.
        </p>
      </section>

      {/* Main Interactive Tool Area */}
      <section className="px-4">
        {!selectedFile && !uploadedImage && (
          <UploadDropzone onFileSelected={handleFileSelected} />
        )}

        {selectedFile && !uploadedImage && (
          <ImagePreviewCard
            file={selectedFile}
            onCancel={handleReset}
            onUpload={handleUpload}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
          />
        )}

        {uploadedImage && (
          <UploadResultCard
            image={uploadedImage}
            onReset={handleReset}
            onDeleted={handleDeleted}
          />
        )}
      </section>

      {/* Adsterra Designated Ad Slot for Home Page */}
      <section className="px-4">
        <AdSlot id="ad-slot-home" />
      </section>

      {/* How It Works Section */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">How Image To URL Works</h2>
          <p className="text-sm text-zinc-400">Three fast and simple steps to share any picture.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-zinc-800 bg-[#18181B] p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold font-mono">
              1
            </div>
            <h3 className="text-base font-semibold text-white">Select or Paste</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Drag & drop any JPG, PNG, WEBP, or GIF file, browse your files, or directly paste from clipboard.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#18181B] p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold font-mono">
              2
            </div>
            <h3 className="text-base font-semibold text-white">Optimize & Retain</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Optionally compress to WebP to save up to 70% bandwidth and select how long you wish to store the image.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#18181B] p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold font-mono">
              3
            </div>
            <h3 className="text-base font-semibold text-white">Get Direct URL</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Copy your direct hotlink, grab ready-to-use HTML or Markdown embed tags, or delete whenever you choose.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Designed For Developers & Creators</h2>
          <p className="text-sm text-zinc-400">Everything you need from an image-to-URL utility.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-2.5">
            <LinkIcon className="w-6 h-6 text-indigo-400" />
            <h4 className="text-base font-semibold text-white">Direct CDN Links</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Direct URLs with correct MIME types and public caching headers for high-speed hotlinking.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-2.5">
            <Zap className="w-6 h-6 text-amber-400" />
            <h4 className="text-base font-semibold text-white">Instant Embeds</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              One-click copying for Markdown documentation, GitHub READMEs, and HTML img elements.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-2.5">
            <Sliders className="w-6 h-6 text-purple-400" />
            <h4 className="text-base font-semibold text-white">Lossless & WebP Optimizer</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Real-time client-side compression reduces file weight before uploading, saving time and storage.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-2.5">
            <Shield className="w-6 h-6 text-emerald-400" />
            <h4 className="text-base font-semibold text-white">Abuse & Security Protected</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Magic byte verification, safe filename sanitization, rate-limiting, and sandboxed CSP headers.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-2.5">
            <Code2 className="w-6 h-6 text-cyan-400" />
            <h4 className="text-base font-semibold text-white">Full REST API</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Programmatic upload, deletion, and retrieval endpoints built for effortless CI/CD and automation.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-2.5">
            <Sparkles className="w-6 h-6 text-indigo-300" />
            <h4 className="text-base font-semibold text-white">AI Alt-Text Generation</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Deep reasoning computer vision provides WCAG-compliant accessibility descriptions for every upload.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Guides & Articles */}
      <section className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              Guides & Articles
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Master Image Hosting & Optimization
            </h2>
            <p className="text-sm text-zinc-400">
              Tutorials on direct linking, Markdown embeds, privacy delete tokens, and the developer REST API.
            </p>
          </div>
          <Link
            to="/articles"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap"
          >
            Browse all articles
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/articles/complete-guide-to-direct-image-linking-and-embeds"
            className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2.5">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                Guides
              </span>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">
                The Complete Guide to Direct Image Linking, HTML & Markdown Embeds
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                Learn how direct image URLs work and how to properly embed hosted images into GitHub Readmes, Discord, Reddit, and HTML sites.
              </p>
            </div>
            <div className="text-xs font-medium text-indigo-400 flex items-center gap-1 pt-2 border-t border-zinc-800/60">
              Read guide <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/articles/image-privacy-and-ephemeral-sharing-explained"
            className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2.5">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Privacy
              </span>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                Image Privacy & Ephemeral Sharing: How Delete Tokens & Expiry Work
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                Understand how cryptographic 48-character delete tokens, automated expiration timers, and metadata stripping protect your personal files.
              </p>
            </div>
            <div className="text-xs font-medium text-emerald-400 flex items-center gap-1 pt-2 border-t border-zinc-800/60">
              Read guide <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/articles/image-to-url-developer-api-and-programmatic-uploads"
            className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2.5">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">
                Developer
              </span>
              <h3 className="text-base font-bold text-white group-hover:text-violet-400 transition-colors line-clamp-2">
                Image To URL Developer API: Automating Image Uploads via cURL & Python
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                Step-by-step developer tutorial for integrating Image To URL into CI/CD pipelines, Discord bots, CLI scripts, and static site builders.
              </p>
            </div>
            <div className="text-xs font-medium text-violet-400 flex items-center gap-1 pt-2 border-t border-zinc-800/60">
              Read guide <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Frequently Asked Questions</h2>
          <p className="text-sm text-zinc-400">Everything you need to know about Image To URL image hosting.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = faqOpenIndex === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-zinc-800 bg-[#18181B] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setFaqOpenIndex(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4"
                >
                  <span className="text-sm sm:text-base font-medium text-white">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-indigo-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-sm text-zinc-400 border-t border-zinc-800/60 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
