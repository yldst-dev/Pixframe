import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import TermAndConditionsPage from './pages/term-and-conditions';
import PrivacyPolicyPage from './pages/privacy-policy';
import SponsorsPage from './pages/sponsors';
import LabPage from './pages/lab/page';
import MetadataPage from './pages/metadata/page';
import DesktopLayout from './components/desktop-layout';
import MobileLayout from './components/mobile-layout';
import ComponentsPage from './pages/components/page';

const Router = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isMobile ? <MobileLayout /> : <DesktopLayout />} />
        <Route path="/privacy_policy.html" element={<PrivacyPolicyPage />} />
        <Route path="/term_and_conditions.html" element={<TermAndConditionsPage />} />
        <Route path="/sponsors" element={<SponsorsPage />} />
        <Route path="/lab" element={<LabPage />} />
        <Route path="/metadata" element={<MetadataPage />} />
        <Route path="/components" element={<ComponentsPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
