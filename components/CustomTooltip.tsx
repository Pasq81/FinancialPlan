import React from 'react';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

// Fix: Define a local interface for the tooltip props because the TooltipProps from recharts might be outdated or incorrect.
// This resolves errors indicating that 'payload' and 'label' properties do not exist on the type.
interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ name: NameType; value: ValueType; color?: string; }>;
    label?: string | number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-800 p-3 border border-gray-600 rounded-lg shadow-xl text-gray-200">
                <p className="font-bold text-sky-400">Età: {label}</p>
                {payload.map((p, index) => (
                    <p key={index} style={{ color: p.color || '#FFFFFF' }}>
                        {p.name}: {formatCurrency(p.value as number)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default CustomTooltip;