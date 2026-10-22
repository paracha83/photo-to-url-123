import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, FileWarning } from 'lucide-react';
import { useToast } from './Toast';

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ onFileSelected, disabled = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      showToast("That file type isn't supported.", 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('This image is larger than the 10 MB limit.', 'error');
      return;
    }

    onFileSelected(file);
  };

  // Clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled) return;
      if (e.clipboardData?.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              handleFiles([file] as unknown as FileList);
              showToast('Image pasted from clipboard!', 'success');
              break;
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [disabled, onFileSelected, showToast]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!disabled && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-8 sm:p-12 text-center flex flex-col items-center justify-center bg-[#18181B] ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-zinc-700/80 hover:border-zinc-500/80 hover:bg-zinc-800/40'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        tabIndex={0}
        role="button"
        aria-label="Upload image drop zone"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* Animated Icon Glow */}
        <div className="relative mb-5">
          <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-md opacity-75 group-hover:opacity-100 transition duration-300"></div>
          <div className="relative w-16 h-16 rounded-2xl bg-zinc-800/90 border border-zinc-700 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300 group-hover:border-indigo-500/50 transition-colors shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>
        </div>

        <h3 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-2">
          Drop your image here, or{' '}
          <span className="text-indigo-400 group-hover:text-indigo-300 underline underline-offset-4 decoration-indigo-400/40">
            browse
          </span>
        </h3>

        <p className="text-sm text-zinc-400 mb-6 max-w-sm">
          Supports drag & drop, file selection, or direct <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-xs text-zinc-300">Ctrl+V</kbd> paste from clipboard.
        </p>

        {/* Format & Size badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-zinc-400">
          <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">JPG</span>
          <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">PNG</span>
          <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">WEBP</span>
          <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">GIF</span>
          <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-indigo-300">Max 10 MB</span>
        </div>
      </div>
    </div>
  );
};
