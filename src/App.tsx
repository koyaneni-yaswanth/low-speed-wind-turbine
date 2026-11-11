import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimationProvider } from './components/animation/AnimationProvider.tsx';
import { useAnimationContext } from './components/animation/animationContext.ts';
import { Navbar } from './components/layout/Navbar.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { trackAnalyticsEvent } from './lib/analytics.ts';

const HomePage = lazy(() => import('./pages/HomePage.tsx').then((m) => ({ default: m.HomePage })));
const TechnologyPage = lazy(() => import('./pages/TechnologyPage.tsx').then((m) => ({ default: m.TechnologyPage })));
const ProductsPage = lazy(() => import('./pages/ProductsPage.tsx').then((m) => ({ default: m.ProductsPage })));
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage.tsx').then((m) => ({ default: m.ApplicationsPage })));
const PerformancePage = lazy(() => import('./pages/PerformancePage.tsx').then((m) => ({ default: m.PerformancePage })));
const PilotPage = lazy(() => import('./pages/PilotPage.tsx').then((m) => ({ default: m.PilotPage })));
const AboutPage = lazy(() => import('./pages/AboutPage.tsx').then((m) => ({ default: m.AboutPage })));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage.tsx').then((m) => ({ default: m.ResourcesPage })));
const ContactPage = lazy(() => import('./pages/ContactPage.tsx').then((m) => ({ default: m.ContactPage })));
const AdminPortalPage = lazy(() => import('./pages/AdminPortalPage.tsx').then((m) => ({ default: m.AdminPortalPage })));

const RouteFallback: React.FC = () => (
  <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
    <div className="h-48 animate-pulse rounded-2xl border border-cyan-500/20 bg-slate-900/20 flex items-center justify-center font-mono text-xs text-cyan-500">
      Loading Pawan Shakti module...
    </div>
  </div>
);

const ScrollAndAnalytics: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    trackAnalyticsEvent('page_view', pathname);
  }, [pathname]);
  return null;
};

const AppShell: React.FC = () => {
  const { theme } = useAnimationContext();
  return (
    <div
      className={`flex min-h-screen flex-col transition-colors ${
        theme === 'dark' ? 'bg-[#060D1A] text-slate-100' : 'bg-[#F6F7F4] text-[#141A18]'
      }`}
    >
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/technology" element={<TechnologyPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/pilot" element={<PilotPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/admin" element={<AdminPortalPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export function App() {
  return (
    <AnimationProvider>
      <BrowserRouter>
        <ScrollAndAnalytics />
        <AppShell />
      </BrowserRouter>
    </AnimationProvider>
  );
}

export default App;
