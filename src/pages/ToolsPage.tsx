import React, { useState } from 'react';
import {
  Wrench,
  Sparkles,
  Sliders,
  Download,
  UploadCloud,
  FileCheck,
  QrCode,
  ArrowRight,
  Maximize2,
  Copy,
  Check,
} from 'lucide-react';
import { optimizeImageClient, formatBytes, OptimizedResult } from '../lib/imageOptimizer';
import { copyToClipboard } from '../lib/clipboard';
import { useToast } from '../components/Toast';
import { useSeo } from '../lib/useSeo';

export const ToolsPage: React.FC = () => {
  useSeo({
    title: 'Image Tools & WebP Converter',
    description: 'Convert PNG and JPEG images to modern WebP format and generate QR codes with Image To URL.',
  });

  const { showToast } = useToast();

  // Tool 1: Converter state
  const [toolFile, setToolFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<'image/webp' | 'image/jpeg' | 'image/png'>('image/webp');
  const [targetQuality, setTargetQuality] = useState<number>(0.85);
  const [targetMaxWidth, setTargetMaxWidth] = useState<number>(1920);
  const [optimizedResult, setOptimizedResult] = useState<OptimizedResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Tool 2: QR Code state
  const [qrUrl, setQrUrl] = useState<string>('');
  const [qrGenerated, setQrGenerated] = useState<string>('');
  const [qrCopied, setQrCopied] = useState<boolean>(false);

  const handleToolFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setToolFile(file);
      setIsProcessing(true);
      try {
        const result = await optimizeImageClient(file, {
          format: targetFormat,
          quality: targetQuality,
          maxWidth: targetMaxWidth,
        });
        setOptimizedResult(result);
      } catch (err) {
        console.error('Processing error:', err);
        showToast('Failed to optimize image', 'error');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const reprocess = async (fmt = targetFormat, q = targetQuality, w = targetMaxWidth) => {
    if (!toolFile) return;
    setIsProcessing(true);
    try {
      const result = await optimizeImageClient(toolFile, {
        format: fmt,
        quality: q,
        maxWidth: w,
      });
      setOptimizedResult(result);
    } catch (err) {
      console.error('Reprocess error:', err);
      showToast('Optimization failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadOptimized = () => {
    if (!optimizedResult || !toolFile) return;
    const a = document.createElement('a');
    a.href = optimizedResult.dataUrl;
    const ext = targetFormat === 'image/webp' ? 'webp' : targetFormat === 'image/jpeg' ? 'jpg' : 'png';
    a.download = `optimized_${toolFile.name.replace(/\.[^/.]+$/, '')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Download started', 'success');
  };

  const handleGenerateQR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrUrl.trim()) return;
    // Uses Google Chart / QR API format or SVG
    const encoded = encodeURIComponent(qrUrl.trim());
    setQrGenerated(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encoded}`);
    showToast('QR code generated!', 'success');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Page Title */}
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Wrench className="w-7 h-7 text-indigo-400" />
          Image Tools & Utilities
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Client-side converters, instant compressors, and shareable QR code generators.
        </p>
      </div>

      {/* Tool 1: Instant Client-Side Image Optimizer */}
      <section className="rounded-2xl border border-zinc-800 bg-[#18181B] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Image Compressor & WebP Converter</h2>
            <p className="text-xs text-zinc-400">Convert JPG/PNG to WebP and compress images right in your browser with zero latency.</p>
          </div>
        </div>

        {!toolFile ? (
          <label className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/40 hover:bg-zinc-800/40 hover:border-zinc-500 cursor-pointer transition-colors">
            <UploadCloud className="w-10 h-10 text-indigo-400 mb-2" />
            <span className="text-sm font-semibold text-white">Select image to optimize</span>
            <span className="text-xs text-zinc-400 mt-1">No file is uploaded to the server; everything is processed on your device</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleToolFileChange}
            />
          </label>
        ) : (
          <div className="space-y-6">
            {/* Settings Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800">
              <div>
                <label className="text-xs font-semibold uppercase text-zinc-400 block mb-1.5">Target Format</label>
                <select
                  value={targetFormat}
                  onChange={(e) => {
                    const fmt = e.target.value as any;
                    setTargetFormat(fmt);
                    reprocess(fmt, targetQuality, targetMaxWidth);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="image/webp">WEBP (Best compression)</option>
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/png">PNG</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold uppercase text-zinc-400">Quality</label>
                  <span className="text-xs text-indigo-400 font-mono">{Math.round(targetQuality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.05"
                  value={targetQuality}
                  onChange={(e) => {
                    const q = parseFloat(e.target.value);
                    setTargetQuality(q);
                    reprocess(targetFormat, q, targetMaxWidth);
                  }}
                  className="w-full accent-indigo-500 cursor-pointer mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-zinc-400 block mb-1.5">Max Dimension</label>
                <select
                  value={targetMaxWidth}
                  onChange={(e) => {
                    const w = parseInt(e.target.value);
                    setTargetMaxWidth(w);
                    reprocess(targetFormat, targetQuality, w);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={2560}>Original / 2560px</option>
                  <option value={1920}>1920px (Full HD)</option>
                  <option value={1280}>1280px (HD)</option>
                  <option value={800}>800px (Mobile Web)</option>
                </select>
              </div>
            </div>

            {/* Results Comparison */}
            {optimizedResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center max-h-64 p-2">
                  <img
                    src={optimizedResult.dataUrl}
                    alt="Optimized Preview"
                    className="max-h-60 w-auto object-contain"
                  />
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Original Size:</span>
                      <span className="font-mono text-zinc-200">{formatBytes(toolFile.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Optimized Size:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{formatBytes(optimizedResult.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Total Savings:</span>
                      <span className="font-mono text-indigo-400 font-semibold">{optimizedResult.compressionRatio}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Dimensions:</span>
                      <span className="font-mono text-zinc-200">{optimizedResult.width} × {optimizedResult.height} px</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleDownloadOptimized}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Converted File</span>
                    </button>
                    <button
                      onClick={() => {
                        setToolFile(null);
                        setOptimizedResult(null);
                      }}
                      className="py-2.5 px-4 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Tool 2: Shareable QR Code Generator */}
      <section className="rounded-2xl border border-zinc-800 bg-[#18181B] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Image URL to QR Code Generator</h2>
            <p className="text-xs text-zinc-400">Turn your shareable Image To URL direct link into a scannable QR code for physical media and presentations.</p>
          </div>
        </div>

        <form onSubmit={handleGenerateQR} className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            placeholder="Paste your image URL here (e.g. https://.../i/abc123)..."
            value={qrUrl}
            onChange={(e) => setQrUrl(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
          >
            <span>Generate QR</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {qrGenerated && (
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="p-3 bg-white rounded-xl shadow-lg">
              <img src={qrGenerated} alt="QR Code" className="w-40 h-40 object-contain" />
            </div>
            <div className="space-y-3 text-center sm:text-left">
              <h4 className="text-sm font-semibold text-white">Scannable QR Code</h4>
              <p className="text-xs text-zinc-400 max-w-sm">
                Scan this code with any smartphone camera to open the direct image link immediately.
              </p>
              <div className="flex gap-2 justify-center sm:justify-start">
                <a
                  href={qrGenerated}
                  download="image_to_url_qrcode.png"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save QR</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
