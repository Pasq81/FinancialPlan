
import React from 'react';
import { LogoIcon } from './Icons';

interface HeaderProps {
  onAddTransaction: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddTransaction }) => {
  return (
    <header className="bg-brand-secondary/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <LogoIcon />
          <h1 className="text-2xl font-bold text-brand-text tracking-wider">
            FinJourney
          </h1>
        </div>
        <button 
          onClick={onAddTransaction}
          className="hidden md:block bg-brand-teal hover:bg-brand-teal/80 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          Aggiungi Transazione
        </button>
        {/* Mobile button (icon only) could be added here later */}
      </div>
    </header>
  );
};

export default Header;
