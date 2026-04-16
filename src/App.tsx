/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import { Upload, Download, Image as ImageIcon, Maximize, Settings2, ShieldCheck, Zap, Smartphone, Target, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ToolsGrid from "@/components/ToolsGrid";

type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp';

interface ImageState {
  file: File;
  preview: string;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  format: ImageFormat;
  quality: number;
}

export default function App() {
  const [image, setImage] = useState<ImageState | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadImage(file);
    }
  };

  const loadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const ar = img.width / img.height;
        setAspectRatio(ar);
        setImage({
          file,
          preview: event.target?.result as string,
          originalWidth: img.width,
          originalHeight: img.height,
          width: img.width,
          height: img.height,
          format: 'image/jpeg',
          quality: 0.8,
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleResize = useCallback(() => {
    if (!image || !canvasRef.current) return;
    setIsResizing(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(img, 0, 0, image.width, image.height);
      
      const dataUrl = canvas.toDataURL(image.format, image.quality);
      const link = document.createElement('a');
      link.download = `resized-${image.file.name.split('.')[0]}.${image.format.split('/')[1]}`;
      link.href = dataUrl;
      link.click();
      setIsResizing(false);
    };
    img.src = image.preview;
  }, [image]);

  const updateWidth = (val: number) => {
    if (!image) return;
    const newWidth = Math.max(1, val);
    if (maintainAspectRatio && aspectRatio) {
      setImage({ ...image, width: newWidth, height: Math.round(newWidth / aspectRatio) });
    } else {
      setImage({ ...image, width: newWidth });
    }
  };

  const updateHeight = (val: number) => {
    if (!image) return;
    const newHeight = Math.max(1, val);
    if (maintainAspectRatio && aspectRatio) {
      setImage({ ...image, height: newHeight, width: Math.round(newHeight * aspectRatio) });
    } else {
      setImage({ ...image, height: newHeight });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ImageIcon className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">PixelResize</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#" className="hover:text-blue-600 transition-colors">How it works</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight"
          >
            Resize Images Instantly
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Fast, private, and 100% client-side. Your images never leave your browser.
          </motion.p>
        </div>

        {/* Tool Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-16">
          {!image ? (
            <div 
              className="p-12 md:p-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 m-4 rounded-xl hover:border-blue-400 transition-colors cursor-pointer group"
              onClick={() => document.getElementById('fileInput')?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) loadImage(file);
              }}
            >
              <input 
                type="file" 
                id="fileInput" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Upload className="text-blue-600 w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Drop your image here</h2>
              <p className="text-gray-500">or click to browse files</p>
              <p className="mt-4 text-xs text-gray-400 uppercase tracking-widest font-bold">Supports PNG, JPG, WEBP</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2">
              {/* Preview Area */}
              <div className="p-6 bg-gray-50 flex items-center justify-center min-h-[400px]">
                <div className="relative group">
                  <img 
                    src={image.preview} 
                    alt="Preview" 
                    className="max-w-full max-h-[500px] rounded-lg shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => setImage(null)}
                    className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur rounded-full shadow-md text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="absolute bottom-2 left-2 px-3 py-1 bg-black/60 backdrop-blur text-white text-xs rounded-full">
                    {image.originalWidth} × {image.originalHeight}
                  </div>
                </div>
              </div>

              {/* Controls Area */}
              <div className="p-8 border-l border-gray-200">
                <div className="flex items-center gap-2 mb-8">
                  <Settings2 size={20} className="text-blue-600" />
                  <h3 className="font-bold text-lg">Resize Options</h3>
                </div>

                <div className="space-y-6">
                  {/* Dimensions */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Width (px)</label>
                      <input 
                        type="number" 
                        value={image.width}
                        onChange={(e) => updateWidth(parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Height (px)</label>
                      <input 
                        type="number" 
                        value={image.height}
                        onChange={(e) => updateHeight(parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Aspect Ratio Toggle */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div 
                      className={`w-10 h-5 rounded-full relative transition-colors ${maintainAspectRatio ? 'bg-blue-600' : 'bg-gray-300'}`}
                      onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${maintainAspectRatio ? 'left-6' : 'left-1'}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Maintain aspect ratio</span>
                  </label>

                  {/* Format Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Output Format</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['image/jpeg', 'image/png', 'image/webp'] as ImageFormat[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => setImage({ ...image, format: f })}
                          className={`py-2 text-sm font-semibold rounded-lg border transition-all ${
                            image.format === f 
                              ? 'bg-blue-600 border-blue-600 text-white' 
                              : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400'
                          }`}
                        >
                          {f.split('/')[1].toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quality Slider */}
                  {image.format !== 'image/png' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quality</label>
                        <span className="text-xs font-bold text-blue-600">{Math.round(image.quality * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.1" 
                        max="1" 
                        step="0.01"
                        value={image.quality}
                        onChange={(e) => setImage({ ...image, quality: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={handleResize}
                    disabled={isResizing}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isResizing ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Download size={20} />
                    )}
                    {isResizing ? 'Processing...' : 'Download Resized Image'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SEO Section (Requested) */}
        <section className="container mx-auto max-w-4xl py-16 border-t border-gray-100">
          <div className="prose prose-blue max-w-none">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Why Use an Online Image Resizer?</h2>
            
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Images play a critical role in website performance, SEO, and user experience. Large images slow down websites, increase bounce rates, and negatively impact search rankings. PixelResize solves this problem by allowing users to resize and compress images instantly without uploading files.
            </p>

            <div className="grid md:grid-cols-2 gap-12 mb-12">
              <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <Zap className="text-green-600 w-5 h-5" />
                  </div>
                  Key Benefits of PixelResize
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-gray-600">
                    <span className="text-xl">⚡</span>
                    <span>Faster website loading speed</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-600">
                    <span className="text-xl">🔒</span>
                    <span>100% private (no upload required)</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-600">
                    <span className="text-xl">📱</span>
                    <span>Works on all devices</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-600">
                    <span className="text-xl">🎯</span>
                    <span>Optimized for SEO and Core Web Vitals</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </section>

        {/* Hidden Canvas for Processing */}
        <canvas ref={canvasRef} className="hidden" />
      </main>

      <ToolsGrid />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <ImageIcon className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">PixelResize</span>
          </div>
          <p className="text-gray-400 text-sm">© 2026 PixelResize. All rights reserved.</p>
          <div className="flex gap-6 text-sm font-medium text-gray-500">
            <a href="#" className="hover:text-blue-600">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

