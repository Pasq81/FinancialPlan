
import React from 'react';

interface InputGroupProps {
    label: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    step?: string;
    tooltip?: string;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, value, onChange, type = 'text', step = '1', tooltip }) => {
    return (
        <div className="relative group">
            <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                step={step}
                className="w-full p-2 border border-gray-600 bg-gray-700 text-white rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            />
            {tooltip && (
                <div className="absolute -top-1 right-0 flex items-center">
                    <span className="text-gray-400 cursor-help">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </span>
                    <div className="absolute bottom-full right-0 mb-2 w-64 bg-gray-800 text-white text-xs rounded-lg p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                        {tooltip}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InputGroup;
