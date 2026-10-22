import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  ArrowRight,
  Clock,
  Shield,
  Layers,
  FileImage,
  RefreshCw,
  Check,
  Maximize2,
  Lock,
  Unlock,
} from 'lucide-react';
import { StorageDuration, UploadOptions } from '../types';
import { optimizeImageClient, formatBytes, OptimizedResult } from '../lib/imageOptimizer';
import {
  getCompressionSettings,
  saveCompressionSettings,
  CompressionSettings,
  getUserPreferences,
} from '../lib/userPreferences';

interface ImagePreviewCardProps {
  file: File;
  onCancel: () => void;
  onUpload: (fileToUpload: File | Blob, options: UploadOptions, isOptimized: boolean) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
}

export const ImagePreviewCard: React.FC<ImagePreviewCardProps> = ({
  file,
  onCancel,
  onUpload,
  isUploading,
  uploadProgress,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const initialPrefs = useMemo(() => getUserPreferences(), []);
  const [expiration, setExpiration] = useState<StorageDuration>(initialPrefs.defaultExpiration || 'never');

  // Compression & Optimization state
  const initialSettings = useMemo(() => getCompressionSettings(), []);
  const [enableOptimization, setEnableOptimization] = useState<boolean>(initialSettings.level !== 'original');
  const [compressionLevel, setCompressionLevel] = useState<'original' | 'low' | 'medium' | 'high'>(initialSettings.level);
  const [convertFormat, setConvertFormat] = useState<'original' | 'webp' | 'jpeg' | 'png'>(initialSettings.format);
  const [resizeOption, setResizeOption] = useState<'original' | 1920 | 1280 | 1024 | 'custom'>(initialSettings.resize);
  const [customWidth, setCustomWidth] = useState<number>(1280);
  const [customHeight, setCustomHeight] = useState<number>(720);
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(true);

  const [optimizedResult, setOptimizedResult] = useState<OptimizedResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  // Load preview and natural dimensions
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setCustomWidth(img.naturalWidth);
      setCustomHeight(img.naturalHeight);
    };
    img.src = url;

    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Quality mapping
  const qualityMap = {
    original: 0.95,
    low: 0.85,
    medium: 0.70,
    high: 0.50,
  };

  // Determine output MIME
  const targetMime = useMemo(() => {
    if (convertFormat === 'original') {
      const srcType = file.type.toLowerCase();
      if (srcType === 'image/png') return 'image/png';
      if (srcType === 'image/webp') return 'image/webp';
      return 'image/jpeg';
    }
    if (convertFormat === 'webp') return 'image/webp';
    if (convertFormat === 'jpeg') return 'image/jpeg';
    return 'image/png';
  }, [convertFormat, file.type]);

  // Determine max dimension
  const maxDim = useMemo(() => {
    if (resizeOption === 'original') return undefined;
    if (resizeOption === 'custom') return customWidth;
    return resizeOption;
  }, [resizeOption, customWidth]);

  // Custom dimension change with aspect ratio lock
  const handleCustomWidthChange = (w: number) => {
    setCustomWidth(w);
    if (aspectRatioLocked && naturalDimensions.width > 0) {
      setCustomHeight(Math.round((w * naturalDimensions.height) / naturalDimensions.width));
    }
  };

  const handleCustomHeightChange = (h: number) => {
    setCustomHeight(h);
    if (aspectRatioLocked && naturalDimensions.height > 0) {
      setCustomWidth(Math.round((h * naturalDimensions.width) / naturalDimensions.height));
    }
  };

  // Run real client-side canvas compression preview
  useEffect(() => {
    if (!enableOptimization && compressionLevel === 'original' && convertFormat === 'original' && resizeOption === 'original') {
      setOptimizedResult(null);
      return;
    }

    let active = true;
    setIsOptimizing(true);

    const timer = setTimeout(() => {
      optimizeImageClient(file, {
        format: targetMime,
        quality: qualityMap[compressionLevel],
        maxWidth: maxDim,
        maxHeight: resizeOption === 'custom' ? customHeight : undefined,
      })
        .then((res) => {
          if (active) {
            setOptimizedResult(res);
            setIsOptimizing(false);
            // Persist preferred settings
            saveCompressionSettings({
              level: compressionLevel,
              format: convertFormat,
              resize: resizeOption,
              customWidth,
              customHeight,
            });
          }
        })
        .catch((err) => {
          console.error('Optimization calculation error:', err);
          if (active) setIsOptimizing(false);
        });
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    file,
    enableOptimization,
    compressionLevel,
    convertFormat,
    targetMime,
    maxDim,
    resizeOption,
    customHeight,
    customWidth,
  ]);

  const handleStartUpload = (useOptimized: boolean) => {
    if (useOptimized && optimizedResult) {
      onUpload(optimizedResult.blob, { expiration }, true);
    } else {
      onUpload(file, { expiration }, false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-zinc-800 bg-[#18181B] p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800 text-indigo-400">
            <FileImage className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-white tracking-tight truncate max-w-xs sm:max-w-md">
              {file.name}
            </h4>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
              <span>{formatBytes(file.size)}</span>
              <span>·</span>
              <span>{file.type.split('/')[1]?.toUpperCase() || 'IMAGE'}</span>
              {naturalDimensions.width > 0 && (
                <>
                  <span>·</span>
                  <span>
                    {naturalDimensions.width} × {naturalDimensions.height} px
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {!isUploading && (
          <button
            onClick={onCancel}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            title="Cancel selection"
            aria-label="Cancel selection"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Image Preview Container */}
      <div className="relative rounded-xl overflow-hidden bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-center max-h-80 group">
        <img
          src={optimizedResult ? optimizedResult.dataUrl : previewUrl}
          alt={file.name}
          className="max-h-80 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.01]"
        />

        {optimizedResult && (
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-medium shadow-lg backdrop-blur-sm flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Saved {optimizedResult.compressionRatio}%</span>
          </div>
        )}
      </div>

      {/* Storage Duration / Retention */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            Storage Duration
          </label>
          <span className="text-[11px] text-zinc-400">Public direct link access</span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {(
            [
              { id: '1h', label: '1 Hour' },
              { id: '1d', label: '1 Day' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'never', label: 'Never' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={isUploading}
              onClick={() => setExpiration(item.id)}
              className={`py-2 px-1 text-xs font-medium rounded-lg border text-center transition-all ${
                expiration === item.id
                  ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 font-semibold'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Optional Compression & Resize Controls (Sections 14 & 15) */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-white">Image Optimization</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
              Resize & Compress
            </span>
          </div>
          <button
            type="button"
            disabled={isUploading}
            onClick={() => {
              const next = !enableOptimization;
              setEnableOptimization(next);
              if (next && compressionLevel === 'original') {
                setCompressionLevel('medium');
              }
            }}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
              enableOptimization ? 'bg-indigo-600' : 'bg-zinc-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                enableOptimization ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {enableOptimization && (
          <div className="pt-3 space-y-4 border-t border-zinc-800/80 animate-in fade-in duration-200 text-xs">
            {/* Compression Level Buttons */}
            <div>
              <label className="text-zinc-400 font-semibold uppercase block mb-1.5 text-[11px]">
                Compression Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { id: 'original', label: 'Original', desc: 'No compression' },
                    { id: 'low', label: 'Low', desc: '85% Quality' },
                    { id: 'medium', label: 'Medium', desc: '70% Quality' },
                    { id: 'high', label: 'High', desc: '50% Quality' },
                  ] as const
                ).map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setCompressionLevel(lvl.id)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      compressionLevel === lvl.id
                        ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 font-semibold'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="font-medium text-white">{lvl.label}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{lvl.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Format Conversion & Resize Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Convert To */}
              <div>
                <label className="text-zinc-400 font-semibold uppercase block mb-1.5 text-[11px]">
                  Convert Format
                </label>
                <select
                  value={convertFormat}
                  onChange={(e) => setConvertFormat(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="original">Original Format</option>
                  <option value="webp">WEBP (Recommended)</option>
                  <option value="jpeg">JPG / JPEG</option>
                  <option value="png">PNG</option>
                </select>
              </div>

              {/* Resize Presets */}
              <div>
                <label className="text-zinc-400 font-semibold uppercase block mb-1.5 text-[11px]">
                  Resize Dimension
                </label>
                <select
                  value={resizeOption}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'original' || val === 'custom') {
                      setResizeOption(val);
                    } else {
                      setResizeOption(parseInt(val) as any);
                    }
                  }}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="original">Original ({naturalDimensions.width || 0}px)</option>
                  <option value={1920}>1920px (Full HD)</option>
                  <option value={1280}>1280px (HD)</option>
                  <option value={1024}>1024px (Standard)</option>
                  <option value="custom">Custom Dimensions</option>
                </select>
              </div>
            </div>

            {/* Custom Dimensions Input */}
            {resizeOption === 'custom' && (
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-zinc-400 block mb-1">Width (px)</label>
                  <input
                    type="number"
                    min={10}
                    max={8000}
                    value={customWidth}
                    onChange={(e) => handleCustomWidthChange(parseInt(e.target.value) || 100)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
                  className={`p-2 rounded mt-4 border transition-colors ${
                    aspectRatioLocked
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                      : 'border-zinc-800 text-zinc-500'
                  }`}
                  title={aspectRatioLocked ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
                >
                  {aspectRatioLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
                <div className="flex-1">
                  <label className="text-[10px] text-zinc-400 block mb-1">Height (px)</label>
                  <input
                    type="number"
                    min={10}
                    max={8000}
                    value={customHeight}
                    onChange={(e) => handleCustomHeightChange(parseInt(e.target.value) || 100)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>
            )}

            {/* Real Calculated Compression Comparison (Section 14) */}
            {optimizedResult && (
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Original:</span>
                  <span className="text-zinc-200">{formatBytes(file.size)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Optimized:</span>
                  <span className="text-emerald-400 font-semibold">{formatBytes(optimizedResult.size)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-zinc-900">
                  <span className="text-zinc-400">Saved:</span>
                  <span className="text-indigo-400 font-semibold">{optimizedResult.compressionRatio}%</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400 font-mono">
            <span>Uploading image...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isUploading}
          className="px-5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700/80 text-sm font-medium transition-colors disabled:opacity-50"
        >
          Cancel
        </button>

        {enableOptimization && optimizedResult ? (
          <div className="flex-1 flex gap-2">
            <button
              type="button"
              onClick={() => handleStartUpload(false)}
              disabled={isUploading}
              className="flex-1 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors disabled:opacity-50"
            >
              Upload Original ({formatBytes(file.size)})
            </button>
            <button
              type="button"
              onClick={() => handleStartUpload(true)}
              disabled={isUploading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Upload Optimized ({formatBytes(optimizedResult.size)})</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleStartUpload(false)}
            disabled={isUploading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <span>Upload Image</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
