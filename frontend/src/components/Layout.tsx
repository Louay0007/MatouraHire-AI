import React, { ReactNode } from 'react';
import Navigation from './Navigation';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;