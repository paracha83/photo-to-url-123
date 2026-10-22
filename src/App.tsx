import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ImagesPage } from './pages/ImagesPage';
import { ToolsPage } from './pages/ToolsPage';
import { AdminPage } from './pages/AdminPage';
import { ArticlesPage } from './pages/ArticlesPage';
import { PrivacyPage, TermsPage, DmcaPage } from './pages/LegalPages';

export default function App() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="min-h-screen flex flex-col bg-[#09090B] text-zinc-100 font-sans selection:bg-indigo-600 selection:text-white">
          {/* Offline Warning Banner per Requirement 33 */}
          {!isOnline && (
            <div className="w-full bg-rose-600 text-white text-xs font-medium py-2 px-4 flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>You are currently offline. Uploading images requires an active internet connection.</span>
            </div>
          )}

          <Navbar />

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/images" element={<ImagesPage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/articles" element={<ArticlesPage />} />
              <Route path="/articles/:slug" element={<ArticlesPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/dmca" element={<DmcaPage />} />
              <Route
                path="*"
                element={
                  <div className="text-center py-24 space-y-4">
                    <h2 className="text-2xl font-bold text-white">404 — Page Not Found</h2>
                    <p className="text-sm text-zinc-400">The requested page does not exist.</p>
                    <Link
                      to="/"
                      className="inline-block px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                    >
                      Return Home
                    </Link>
                  </div>
                }
              />
            </Routes>
          </main>

          <Footer />
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
