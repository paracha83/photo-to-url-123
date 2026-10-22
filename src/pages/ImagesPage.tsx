import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Images,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Search,
  UploadCloud,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
  Key,
} from 'lucide-react';
import { ImageRecord } from '../types';
import { getLocalHistory, removeFromHistory, clearHistory } from '../lib/storageHistory';
import { getSessionDeleteToken } from '../lib/userPreferences';
import { copyToClipboard } from '../lib/clipboard';
import { formatBytes } from '../lib/imageOptimizer';
import { useToast } from '../components/Toast';
import { AdSlot } from '../components/AdSlot';
import { useSeo } from '../lib/useSeo';

export const ImagesPage: React.FC = () => {
  useSeo({
    title: 'My Uploaded Images',
    description: 'Browse, manage, and share your images hosted on Image To URL.',
  });

  const [images, setImages] = useState<ImageRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [imageToDelete, setImageToDelete] = useState<ImageRecord | null>(null);
  const [manualToken, setManualToken] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const loadHistory = async () => {
    setIsLoading(true);
    // Load local history immediately for fast initial render
    const local = getLocalHistory();
    setImages(local);

    try {
      const res = await fetch('/api/images');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.images)) {
          const localMap = new Map(local.map((item) => [item.id, item]));

          // Merge server images with any local friendly names or details
          const mergedServerImages: ImageRecord[] = data.images.map((srvImg: ImageRecord) => {
            const loc = localMap.get(srvImg.id);
            return {
              ...srvImg,
              originalFilename: loc?.originalFilename || srvImg.originalFilename || srvImg.id,
              width: loc?.width || srvImg.width || 0,
              height: loc?.height || srvImg.height || 0,
            };
          });

          // Retain any pending local images not yet indexed by server
          const serverIds = new Set(data.images.map((img: ImageRecord) => img.id));
          const localOnly = local.filter((img) => !serverIds.has(img.id));

          setImages([...localOnly, ...mergedServerImages]);
        }
      }
    } catch (err) {
      console.warn('Failed to sync with /api/images:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleCopy = async (url: string, id: string) => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedId(id);
      showToast('Copied image URL to clipboard!', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!imageToDelete) return;
    setIsDeleting(true);

    try {
      const activeToken = getSessionDeleteToken(imageToDelete.id) || manualToken.trim();
      const headers: Record<string, string> = {};
      if (activeToken) {
        headers['x-delete-token'] = activeToken;
      }

      const res = await fetch(`/api/images/${imageToDelete.id}`, {
        method: 'DELETE',
        headers,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        removeFromHistory(imageToDelete.id);
        loadHistory();
        showToast('Image permanently deleted from storage', 'success');
        setImageToDelete(null);
        setManualToken('');
      } else if (res.status === 404) {
        // If already deleted or expired remotely
        removeFromHistory(imageToDelete.id);
        loadHistory();
        showToast('Image was already removed from remote storage; history entry cleared', 'info');
        setImageToDelete(null);
        setManualToken('');
      } else {
        showToast(data.message || 'Deletion failed. Requires valid delete token or admin key.', 'error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Network error while deleting image', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveFromHistoryOnly = () => {
    if (!imageToDelete) return;
    removeFromHistory(imageToDelete.id);
    loadHistory();
    showToast('Removed from local history', 'info');
    setImageToDelete(null);
    setManualToken('');
  };

  const filteredImages = images.filter((img) =>
    img.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    img.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Images className="w-7 h-7 text-indigo-400" />
            My Uploaded Images
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Browse and manage your images hosted on Image To URL from this device.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadHistory();
              showToast('Refreshed images from server', 'info');
            }}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
            title="Sync with server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>

          {images.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Clear all local upload records from this browser? (Note: Stored images on the server will not be deleted).')) {
                  clearHistory();
                  loadHistory();
                  showToast('Local history cleared', 'info');
                }
              }}
              className="px-3 py-2 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Clear History
            </button>
          )}

          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/20"
          >
            <UploadCloud className="w-4 h-4" />
            <span>New Upload</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      {images.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by filename or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181B] border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {filteredImages.length} {filteredImages.length === 1 ? 'image' : 'images'}
          </span>
        </div>
      )}

      {/* Images Grid or Empty State */}
      {images.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-zinc-800 bg-[#18181B]/40 p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 text-zinc-500 mx-auto flex items-center justify-center">
            <Images className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-white">No uploaded images yet</h3>
          <p className="text-sm text-zinc-400 max-w-sm mx-auto">
            Upload images from the home page to get instant shareable URLs, embed codes, and track them here.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg shadow-indigo-600/20 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload an Image</span>
          </Link>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="text-center py-12 text-zinc-400 text-sm">
          No images match your search query "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((img) => (
            <div
              key={img.id}
              className="rounded-2xl border border-zinc-800 bg-[#18181B] overflow-hidden flex flex-col group hover:border-zinc-700 transition-colors shadow-lg"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-zinc-800/80">
                <img
                  src={img.publicUrl}
                  alt={img.originalFilename}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-zinc-900/90 border border-zinc-800 text-[10px] font-mono text-zinc-300">
                  {img.mimeType.split('/')[1]?.toUpperCase()}
                </span>
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-zinc-900/90 border border-zinc-800 text-[10px] font-mono text-zinc-300">
                  {formatBytes(img.size)}
                </span>
              </div>

              {/* Info Details */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-white truncate" title={img.originalFilename}>
                    {img.originalFilename}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
                    <span>{new Date(img.createdAt).toLocaleDateString()}</span>
                    <span>
                      {img.width > 0 ? `${img.width}×${img.height} px` : ''}
                    </span>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-zinc-800/80">
                  <button
                    onClick={() => handleCopy(img.publicUrl, img.id)}
                    className="py-1.5 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                    title="Copy direct URL"
                  >
                    {copiedId === img.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId === img.id ? 'Copied' : 'Link'}</span>
                  </button>

                  <a
                    href={img.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                    title="Open image"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View</span>
                  </a>

                  <button
                    onClick={() => {
                      setImageToDelete(img);
                      setManualToken('');
                    }}
                    className="py-1.5 px-2 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 text-xs font-medium flex items-center justify-center gap-1 transition-colors border border-rose-900/30"
                    title="Delete image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Adsterra Designated Ad Slot for Images Page */}
      <AdSlot id="ad-slot-images" className="mt-12" />

      {/* Delete Confirmation Modal */}
      {imageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-lg bg-rose-500/10">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Stored Image?</h3>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-mono text-white">"{imageToDelete.originalFilename}"</span>? It will be removed from persistent storage and the direct URL will return 404.
            </p>

            {/* If not in current runtime session memory, allow optional manual token or admin key */}
            {!getSessionDeleteToken(imageToDelete.id) && (
              <div className="space-y-1.5 pt-1">
                <label className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Delete Token or Admin Key (Optional)</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter delete secret or admin key..."
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setImageToDelete(null);
                  setManualToken('');
                }}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveFromHistoryOnly}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-lg border border-zinc-800 bg-zinc-800/60 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                title="Remove reference from local browser history only"
              >
                Remove from History Only
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20 transition-all"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Remote Object</span>
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
