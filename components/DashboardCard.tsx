
import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  progress?: number;
  variant?: 'default' | 'danger';
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, progress, variant = 'default' }) => {
  const baseClasses = "rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border";
  
  const variantClasses = variant === 'danger' 
    ? "bg-red-900/20 border-red-500/50 hover:border-red-400" 
    : "bg-brand-secondary border-brand-accent hover:border-brand-teal";

  const textClasses = variant === 'danger' ? "text-red-200" : "text-brand-light";
  const valueClasses = variant === 'danger' ? "text-red-50" : "text-brand-text";
  const iconColorClass = variant === 'danger' ? "text-red-500" : "text-brand-teal";

  return (
    <div className={`${baseClasses} ${variantClasses}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-medium ${textClasses}`}>{title}</h3>
        <div className={iconColorClass}>{icon}</div>
      </div>
      <p className={`text-4xl font-bold ${valueClasses} mb-4`}>{value}</p>
      {progress !== undefined && (
        <div>
          <div className="w-full bg-brand-accent rounded-full h-2.5">
            <div
              className="bg-brand-teal h-2.5 rounded-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
           <p className="text-right text-sm text-brand-light mt-1">{progress.toFixed(0)}% Completato</p>
        </div>
      )}
    </div>
  );
};

export default DashboardCard;
