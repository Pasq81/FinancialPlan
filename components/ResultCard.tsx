
import React from 'react';

interface ResultCardProps {
    title: string;
    value: string;
    description: string;
    isGood: boolean;
    comparisonText: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ title, value, description, isGood, comparisonText }) => {
    const borderColor = isGood ? 'border-green-500' : 'border-amber-500';
    const valueColor = isGood ? 'text-green-400' : 'text-amber-400';

    return (
        <div className={`p-4 rounded-xl shadow-md border-l-4 ${borderColor} bg-gray-700/50`}>
            <h3 className="text-lg font-semibold text-gray-100 mb-1">{title}</h3>
            <p className={`text-3xl font-bold ${valueColor} mb-2`}>{value}</p>
            <p className="text-sm text-gray-400 italic mb-2">{description}</p>
            <div className="text-base font-medium text-gray-300">
                {comparisonText}
            </div>
        </div>
    );
};

export default ResultCard;
