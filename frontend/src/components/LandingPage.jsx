import React, { useState, useEffect } from 'react';
import LandingMobile from './LandingMobile';
import LandingDesktop from './LandingDesktop';

export default function LandingPage({ onLaunch }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile ? <LandingMobile onLaunch={onLaunch} /> : <LandingDesktop onLaunch={onLaunch} />;
}
