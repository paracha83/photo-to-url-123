import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Download,
  Trash2,
  Code,
  FileText,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  AlertTriangle,
} from 'lucide-react';
import { ImageRecord, AIAnalysisResult } from '../types';
import { copyToClipboard } from '../lib/clipboard';
import { formatBytes } from '../lib/imageOptimizer';
import { getSessionDeleteToken } from '../lib/userPreferences';
import { useToast } from './Toast';
import { AdSlot } from './AdSlot';

interface UploadResultCardProps {
  image: ImageRecord;
  onReset: () => void;
  onDeleted: () => void;
}

export const UploadResultCard: React.FC<UploadResultCardProps> = ({ image, onReset, onDeleted }) => {
  const { showToast } = useToast();
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

  const directUrl = image.publicUrl;
  const customAlt = aiResult?.altText || image.originalFilename.replace(/\.[^/.]+$/, '');
  const htmlEmbed = `<img src="${directUrl}" alt="${customAlt}">`;
  const markdownEmbed = `![${customAlt}](${directUrl})`;

  const handleCopy = async (text: string, type: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedType(type);
      showToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopiedType(null), 2500);
    } else {
      showToast('Could not copy to clipboard automatically', 'error');
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = directUrl;
    a.download = image.originalFilename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Download started', 'info');
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = image.deleteToken || getSessionDeleteToken(image.id) || '';
      const headers: Record<string, string> = {};
      if (token) {
        headers['x-delete-token'] = token;
      }

      const res = await fetch(`/api/images/${image.id}`, {
        method: 'DELETE',
        headers,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Image permanently deleted from storage', 'success');
        setShowDeleteModal(false);
        onDeleted();
      } else {
        showToast(data.message || 'Failed to delete image', 'error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Network error while deleting image', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerateAIAltText = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: image.id }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.analysis) {
        setAiResult(data.analysis);
        showToast('Generated WCAG Alt-Text with Gemini Thinking Mode!', 'success');
      } else {
        showToast(data.message || 'AI visual analysis unavailable', 'error');
      }
    } catch (err) {
      console.error('AI analysis error:', err);
      showToast('Could not complete AI visual analysis', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Main Success Container */}
      <div className="rounded-2xl border border-zinc-800 bg-[#18181B] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Upload Complete</h3>
              <p className="text-xs text-zinc-400 font-mono">Image is live on public CDN storage</p>
            </div>
          </div>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Upload Another</span>
          </button>
        </div>

        {/* Live Image Preview with Overlay */}
        <div className="relative rounded-xl overflow-hidden bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-center max-h-80 group">
          <img
            src={directUrl}
            alt={image.originalFilename}
            className="max-h-80 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.01]"
          />
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono text-zinc-300 shadow">
            {image.mimeType.toUpperCase()} · {formatBytes(image.size)}
          </div>
        </div>

        {/* Direct URL Share Box */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
            <span>Direct Image URL</span>
            <span className="text-[11px] text-emerald-400 font-mono">Active Link</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={directUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm font-mono text-indigo-300 focus:outline-none focus:border-indigo-500 selection:bg-indigo-600"
            />
            <button
              onClick={() => handleCopy(directUrl, 'url')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all shrink-0"
            >
              {copiedType === 'url' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedType === 'url' ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            <span>Open Link</span>
          </a>

          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Download</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-rose-900/40 bg-rose-950/20 hover:bg-rose-900/30 text-rose-300 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Delete</span>
          </button>
        </div>

        {/* Embed Snippets (HTML & Markdown) */}
        <div className="space-y-3 pt-2">
          {/* HTML */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-indigo-400" />
                HTML Embed Code
              </span>
              <button
                onClick={() => handleCopy(htmlEmbed, 'html')}
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 py-0.5 px-2 rounded hover:bg-zinc-800 transition-colors"
              >
                {copiedType === 'html' ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedType === 'html' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <code className="block bg-zinc-950 p-2.5 rounded-lg text-xs font-mono text-zinc-300 overflow-x-auto selection:bg-indigo-600">
              {htmlEmbed}
            </code>
          </div>

          {/* Markdown */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                Markdown Embed Code
              </span>
              <button
                onClick={() => handleCopy(markdownEmbed, 'md')}
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 py-0.5 px-2 rounded hover:bg-zinc-800 transition-colors"
              >
                {copiedType === 'md' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedType === 'md' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <code className="block bg-zinc-950 p-2.5 rounded-lg text-xs font-mono text-zinc-300 overflow-x-auto selection:bg-indigo-600">
              {markdownEmbed}
            </code>
          </div>
        </div>

        {/* AI Smart Alt-Text & WCAG Inspector */}
        <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                AI Accessibility & Alt-Text (Gemini 3.1 Pro)
              </span>
            </div>
            {!aiResult && (
              <button
                onClick={handleGenerateAIAltText}
                disabled={isAnalyzing}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Alt-Text</span>
                  </>
                )}
              </button>
            )}
          </div>

          {aiResult ? (
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 text-zinc-200">
                <span className="font-semibold text-indigo-300">Generated WCAG Alt-Text: </span>
                <span>{aiResult.altText}</span>
              </div>
              {aiResult.visualSummary && (
                <div className="text-zinc-400 text-[11px] leading-relaxed">
                  <span className="font-medium text-zinc-300">Visual Insights: </span>
                  {aiResult.visualSummary}
                </div>
              )}
              {aiResult.tags && aiResult.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {aiResult.tags.map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 text-[10px] font-mono"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-400 leading-relaxed">
              Auto-generate search-engine optimized alt-text, descriptions, and semantic visual tags using deep reasoning computer vision.
            </p>
          )}
        </div>

        {/* Detailed Image Metadata Table */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Image File Details
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-zinc-400 block text-[11px]">Filename</span>
              <span className="font-mono text-zinc-200 truncate block" title={image.originalFilename}>
                {image.originalFilename}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[11px]">Image ID</span>
              <span className="font-mono text-zinc-200">{image.id}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[11px]">Format / MIME</span>
              <span className="font-mono text-zinc-200">{image.mimeType}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[11px]">File Size</span>
              <span className="font-mono text-zinc-200">{formatBytes(image.size)}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[11px]">Dimensions</span>
              <span className="font-mono text-zinc-200">
                {image.width > 0 ? `${image.width} × ${image.height} px` : '—'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[11px]">Storage Retention</span>
              <span className="font-mono text-zinc-200">
                {image.expiresAt ? new Date(image.expiresAt).toLocaleDateString() : 'Permanent'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Adsterra Designated Ad Slot for Result Page */}
      <AdSlot id="ad-slot-result" />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-lg bg-rose-500/10">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Permanently Delete Image?</h3>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              This will permanently delete <span className="font-mono text-white">"{image.originalFilename}"</span> from persistent storage. Any existing links, HTML, or Markdown embeds will immediately stop working.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Keep Image
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-600/20 transition-all"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
