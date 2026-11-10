import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { trackAnalyticsEvent } from './lib/analytics.ts';
import { HomePage } from './pages/HomePage.tsx';
import { TechnologyPage } from './pages/TechnologyPage.tsx';
import { ProductsPage } from './pages/ProductsPage.tsx';
import { ApplicationsPage } from './pages/ApplicationsPage.tsx';
import { PerformancePage } from './pages/PerformancePage.tsx';
import { PilotPage } from './pages/PilotPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { ResourcesPage } from './pages/ResourcesPage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { AdminPortalPage } from './pages/AdminPortalPage.tsx';

const ScrollAndAnalytics: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    trackAnalyticsEvent('page_view', pathname);
  }, [pathname]);
  return null;
};

export function App() {
  return (
    <BrowserRouter>
      <ScrollAndAnalytics />
      <div className="flex min-h-screen flex-col bg-[#F6F7F4] text-[#141A18]">
        <Navbar />
        <main className="flex-1">
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
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
