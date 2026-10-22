import React from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, ShieldCheck, BookOpen } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-zinc-800/80 bg-[#09090B] py-12 text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <UploadCloud className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-base tracking-tight">Image To URL</span>
            </div>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
              Simple, high-performance image hosting and sharing. Upload an image, get a direct URL in seconds with HTML, BBCode, and Markdown embed codes.
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>TLS Encrypted · Direct CDN links · Zero compression loss on original</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Upload Tool
                </Link>
              </li>
              <li>
                <Link to="/images" className="hover:text-white transition-colors">
                  My Uploads
                </Link>
              </li>
              <li>
                <Link to="/tools" className="hover:text-white transition-colors">
                  Image Tools & WebP
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition-colors">
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Guides & Articles */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-3 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Guides & Articles</span>
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/articles" className="hover:text-white transition-colors font-medium text-indigo-400">
                  All Articles & Guides
                </Link>
              </li>
              <li>
                <Link
                  to="/articles/complete-guide-to-direct-image-linking-and-embeds"
                  className="hover:text-white transition-colors line-clamp-1"
                >
                  Direct Linking Guide
                </Link>
              </li>
              <li>
                <Link
                  to="/articles/markdown-and-embed-codes-cheatsheet"
                  className="hover:text-white transition-colors line-clamp-1"
                >
                  Markdown Cheatsheet
                </Link>
              </li>
              <li>
                <Link
                  to="/articles/image-to-url-developer-api-and-programmatic-uploads"
                  className="hover:text-white transition-colors line-clamp-1"
                >
                  Developer API
                </Link>
              </li>
              <li>
                <Link
                  to="/articles/image-privacy-and-ephemeral-sharing-explained"
                  className="hover:text-white transition-colors line-clamp-1"
                >
                  Privacy & Expiry
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-3">Legal & Safety</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/dmca" className="hover:text-white transition-colors">
                  DMCA & Abuse Report
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} Image To URL. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Built for speed, privacy, and seamless sharing</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
