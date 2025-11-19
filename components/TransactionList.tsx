
import React from 'react';
import type { WealthRecord } from '../types';
import { WalletIcon } from './Icons';

interface TransactionListProps {
  transactions: WealthRecord[];
}

const WealthItem: React.FC<{ record: WealthRecord }> = ({ record }) => {
  return (
    <li className="flex items-center justify-between p-4 bg-brand-secondary/50 hover:bg-brand-secondary rounded-lg transition-colors duration-200">
      <div className="flex items-center space-x-4">
        <div className="p-2 rounded-full bg-brand-teal/20 text-brand-teal">
          <WalletIcon />
        </div>
        <div>
          <p className="font-semibold text-brand-text">Patrimonio {record.year}</p>
          {record.note && <p className="text-sm text-brand-light">{record.note}</p>}
        </div>
      </div>
      <p className="font-bold text-lg text-brand-text">
        {record.amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
      </p>
    </li>
  );
};


const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  return (
    <div className="bg-brand-secondary border border-brand-accent rounded-xl p-6 shadow-lg h-full">
      <h2 className="text-2xl font-bold text-brand-text mb-6">Transazioni Annuali</h2>
      {transactions.length === 0 ? (
        <p className="text-brand-light text-center italic">Nessun dato registrato.</p>
      ) : (
        <ul className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
          {transactions
            .sort((a, b) => b.year - a.year)
            .map((record) => (
              <WealthItem key={record.id} record={record} />
            ))}
        </ul>
      )}
    </div>
  );
};

export default TransactionList;
