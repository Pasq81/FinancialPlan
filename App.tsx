
import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import DashboardCard from './components/DashboardCard';
import TransactionList from './components/TransactionList';
import BalanceChart from './components/BalanceChart';
import CollapsiblePanel from './components/CollapsiblePanel';
import { WalletIcon, PiggyBankIcon, ChartBarIcon, ExclamationTriangleIcon } from './components/Icons';
import type { WealthRecord, ChartDataPoint } from './types';

const InputField: React.FC<{label: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string, type?: string, step?: string}> = ({ label, value, onChange, placeholder, type = "number", step }) => (
  <div>
    <label className="block text-sm font-medium text-brand-light mb-1">{label}</label>
    <input 
      type={type}
      step={step}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-brand-primary border border-brand-accent rounded-md p-2 text-brand-text focus:ring-brand-teal focus:border-brand-teal transition"
    />
  </div>
);

const AddTransactionModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (year: number, amount: number) => void }> = ({ isOpen, onClose, onSave }) => {
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [amount, setAmount] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (year && amount) {
      onSave(parseInt(year), parseFloat(amount));
      setYear(new Date().getFullYear().toString());
      setAmount('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-brand-secondary border border-brand-accent rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-bold text-brand-text mb-4">Aggiungi Patrimonio Annuale</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField label="Anno" value={year} onChange={(e) => setYear(e.target.value)} placeholder="YYYY" />
          <InputField label="Importo Patrimonio" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          
          <div className="flex justify-end space-x-3 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-brand-light hover:text-brand-text hover:bg-brand-primary transition"
            >
              Annulla
            </button>
            <button 
              type="submit"
              className="px-4 py-2 rounded-lg bg-brand-teal hover:bg-brand-teal/80 text-white font-semibold transition"
            >
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // State inputs with updated defaults
  const [age, setAge] = useState<number | string>(44);
  const [annualSpending, setAnnualSpending] = useState<number | string>(22000);
  const [annualMortgage, setAnnualMortgage] = useState<number | string>(6500);
  
  // Mortgage timing inputs
  const [mortgageStartYear, setMortgageStartYear] = useState<number | string>(2020);
  const [mortgageEndYear, setMortgageEndYear] = useState<number | string>(2040);
  
  // New Projection Inputs
  const [annualContribution, setAnnualContribution] = useState<number | string>(12000);
  const [inflationRate, setInflationRate] = useState<number | string>(2);
  const [returnRate, setReturnRate] = useState<number | string>(5);
  const [taxRate, setTaxRate] = useState<number | string>(26); // Default 26% capital gains tax
  const [retirementAge, setRetirementAge] = useState<number | string>(60);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wealthRecords, setWealthRecords] = useState<WealthRecord[]>([
    { id: 1, year: 2023, amount: 150000 },
    { id: 2, year: 2022, amount: 135000 },
  ]);

  const handleAddRecord = (year: number, amount: number) => {
    setWealthRecords(prev => {
      const existingIndex = prev.findIndex(record => record.year === year);
      
      if (existingIndex >= 0) {
        // Update existing record
        const updatedRecords = [...prev];
        updatedRecords[existingIndex] = {
          ...updatedRecords[existingIndex],
          amount: amount
        };
        return updatedRecords;
      } else {
        // Add new record
        const newRecord: WealthRecord = {
          id: Date.now(),
          year,
          amount
        };
        return [...prev, newRecord];
      }
    });
  };

  // Calculate current balance based ONLY on the latest year record
  const currentBalance = useMemo(() => {
    if (wealthRecords.length > 0) {
      // Sort by year descending and take the first one
      return [...wealthRecords].sort((a, b) => b.year - a.year)[0].amount;
    }
    return 0;
  }, [wealthRecords]);
  
  const savingsGoal = 500000; // Example fixed goal
  const savingsProgress = (currentBalance / savingsGoal) * 100;

  // Derived monthly expenses from annual spending input
  const monthlyExpenses = useMemo(() => {
    const annual = typeof annualSpending === 'number' ? annualSpending : parseFloat(annualSpending as string);
    return isNaN(annual) ? 0 : annual / 12;
  }, [annualSpending]);

  const combinedChartData: ChartDataPoint[] = useMemo(() => {
    const parsedAge = typeof age === 'number' ? age : parseInt(age as string, 10);
    const parsedAnnualMortgage = typeof annualMortgage === 'number' ? annualMortgage : parseFloat(annualMortgage as string);
    const parsedMortgageStartYear = typeof mortgageStartYear === 'number' ? mortgageStartYear : parseInt(mortgageStartYear as string, 10);
    const parsedMortgageEndYear = typeof mortgageEndYear === 'number' ? mortgageEndYear : parseInt(mortgageEndYear as string, 10);
    const parsedAnnualSpending = typeof annualSpending === 'number' ? annualSpending : parseFloat(annualSpending as string);
    
    // Projection params
    const parsedContribution = typeof annualContribution === 'number' ? annualContribution : parseFloat(annualContribution as string);
    const parsedInflation = typeof inflationRate === 'number' ? inflationRate : parseFloat(inflationRate as string);
    const parsedReturn = typeof returnRate === 'number' ? returnRate : parseFloat(returnRate as string);
    const parsedTaxRate = typeof taxRate === 'number' ? taxRate : parseFloat(taxRate as string);
    const parsedRetirementAge = typeof retirementAge === 'number' ? retirementAge : parseInt(retirementAge as string, 10);

    const currentYear = new Date().getFullYear();

    if (isNaN(parsedAge) || parsedAge <= 0) {
      return [];
    }

    // Calculate birth year to map years to ages
    const birthYear = currentYear - parsedAge;

    // Find the earliest year to start the chart
    const earliestRecordYear = wealthRecords.length > 0 
      ? Math.min(...wealthRecords.map(r => r.year)) 
      : currentYear;
    
    // Find the latest recorded year to start projection from
    const latestRecordYear = wealthRecords.length > 0
      ? Math.max(...wealthRecords.map(r => r.year))
      : currentYear - 1; 
    
    // Get starting wealth for projection
    let runningWealth = 0;
    const latestRecord = wealthRecords.find(r => r.year === latestRecordYear);
    if (latestRecord) {
        runningWealth = latestRecord.amount;
    }

    const startYear = Math.min(currentYear, earliestRecordYear);
    const startAge = startYear - birthYear;

    const data: ChartDataPoint[] = [];

    // Prepare projection variables
    const r = isNaN(parsedReturn) ? 0 : parsedReturn / 100;
    const i = isNaN(parsedInflation) ? 0 : parsedInflation / 100;
    const taxPct = isNaN(parsedTaxRate) ? 0 : parsedTaxRate / 100;
    
    let currentContribution = isNaN(parsedContribution) ? 0 : parsedContribution;
    const baseSpending = isNaN(parsedAnnualSpending) ? 0 : parsedAnnualSpending;

    // Loop from start age up to 100
    for (let currentLoopAge = startAge; currentLoopAge <= 100; currentLoopAge++) {
      const loopYear = birthYear + currentLoopAge;
      const isRetired = !isNaN(parsedRetirementAge) && currentLoopAge >= parsedRetirementAge;
      
      // 1. Determine Mortgage Spending (Fixed)
      const isPayingMortgage = !isNaN(parsedMortgageStartYear) && 
                               !isNaN(parsedMortgageEndYear) && 
                               loopYear >= parsedMortgageStartYear && 
                               loopYear <= parsedMortgageEndYear;
                               
      const mortgageAmount = isPayingMortgage && !isNaN(parsedAnnualMortgage) ? parsedAnnualMortgage : 0;
      
      // 2. Determine Lifestyle Spending (Inflated)
      let lifestyleSpending = baseSpending;
      if (loopYear > currentYear) {
          const yearsInFuture = loopYear - currentYear;
          lifestyleSpending = baseSpending * Math.pow(1 + i, yearsInFuture);
      }

      // 3. Total Expenses
      const totalExpenses = mortgageAmount + lifestyleSpending;

      // 4. Wealth Logic
      let wealthValue: number | undefined = undefined;
      const historicalRecord = wealthRecords.find(r => r.year === loopYear);

      if (historicalRecord) {
          // Use actual historical data
          wealthValue = historicalRecord.amount;
          if (loopYear === latestRecordYear) {
              runningWealth = historicalRecord.amount;
          }
      } else if (loopYear > latestRecordYear) {
          // Project Future Wealth
          
          // Calculate Gross Return
          const grossReturn = runningWealth * r;
          // Calculate Tax on Return
          const taxOnReturn = grossReturn * taxPct;

          // Add growth to wealth first
          runningWealth += grossReturn;

          if (isRetired) {
             // Retirement Phase: 
             // 1. No Contribution
             // 2. Subtract Expenses
             // 3. Subtract Tax on Returns (as requested: "spese maggiorate della tassazione")
             runningWealth -= (totalExpenses + taxOnReturn);
          } else {
             // Working Phase:
             // 1. Add Contribution
             runningWealth += currentContribution;
             // Note: We are NOT subtracting expenses here, assuming "Contribution" is net savings.
             // We are also NOT subtracting tax here based on the specific prompt request to do it "from retirement onwards".
          }

          // Inflate contribution for the NEXT year
          currentContribution = currentContribution * (1 + i);

          // Prevent negative wealth in projection
          if (runningWealth < 0) runningWealth = 0;

          wealthValue = runningWealth;
      }

      data.push({
        eta: currentLoopAge,
        anno: loopYear,
        spesaMutuo: mortgageAmount,
        spesaTotale: totalExpenses,
        patrimonio: wealthValue
      });
    }

    return data;
  }, [age, annualMortgage, mortgageStartYear, mortgageEndYear, wealthRecords, annualContribution, inflationRate, returnRate, annualSpending, retirementAge, taxRate]);

  // Determine if/when wealth goes to zero
  const financialFailurePoint = useMemo(() => {
    // We only care about "running out" of money, not starting with 0 if that's what user input.
    // However, the simplest check is if wealth hits 0 at any point in the list.
    // Assuming checking all points is valid.
    return combinedChartData.find(d => d.patrimonio !== undefined && d.patrimonio <= 0);
  }, [combinedChartData]);

  return (
    <div className="min-h-screen bg-brand-primary font-sans text-brand-text">
      <Header onAddTransaction={() => setIsModalOpen(true)} />
      
      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleAddRecord} 
      />

      <main className="container mx-auto p-4 md:p-8">
        <div className="space-y-6 mb-8">
          <CollapsiblePanel title="Situazione di Partenza" initialOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Età attuale" value={age} onChange={e => setAge(e.target.value)} placeholder="es. 44" />
              <div className="hidden md:block text-brand-light text-sm italic flex items-end pb-3">
                 Inserisci la tua età per calcolare la linea temporale.
              </div>
            </div>
          </CollapsiblePanel>
          
          <CollapsiblePanel title="Spese" initialOpen={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <InputField label="Spesa annuale (no mutuo)" value={annualSpending} onChange={e => setAnnualSpending(e.target.value)} placeholder="es. 22000" />
              <InputField label="Rata Mutuo annuale" value={annualMortgage} onChange={e => setAnnualMortgage(e.target.value)} placeholder="es. 6500" />
              <InputField label="Anno inizio mutuo" value={mortgageStartYear} onChange={e => setMortgageStartYear(e.target.value)} placeholder="es. 2020" />
              <InputField label="Anno fine mutuo" value={mortgageEndYear} onChange={e => setMortgageEndYear(e.target.value)} placeholder="es. 2040" />
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Proiezioni Future" initialOpen={true}>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <InputField 
                    label="Contribuzione annuale" 
                    value={annualContribution} 
                    onChange={e => setAnnualContribution(e.target.value)} 
                    placeholder="es. 12000" 
                />
                <InputField 
                    label="Inflazione stimata (%)" 
                    value={inflationRate} 
                    onChange={e => setInflationRate(e.target.value)} 
                    placeholder="es. 2.0" 
                    step="0.1"
                />
                <InputField 
                    label="Rendimento stimato (%)" 
                    value={returnRate} 
                    onChange={e => setReturnRate(e.target.value)} 
                    placeholder="es. 5.0" 
                    step="0.1"
                />
                <InputField 
                    label="Tassazione Rendimenti (%)" 
                    value={taxRate} 
                    onChange={e => setTaxRate(e.target.value)} 
                    placeholder="es. 26" 
                    step="0.1"
                />
                <InputField 
                    label="Età ritiro" 
                    value={retirementAge} 
                    onChange={e => setRetirementAge(e.target.value)} 
                    placeholder="es. 60" 
                />
             </div>
          </CollapsiblePanel>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {financialFailurePoint ? (
              <DashboardCard
                title="Patrimonio Esaurito!"
                value={`Anno ${financialFailurePoint.anno} (Età ${financialFailurePoint.eta})`}
                icon={<ExclamationTriangleIcon />}
                variant="danger"
              />
          ) : (
              <DashboardCard
                title="Ultimo Patrimonio Registrato"
                value={currentBalance.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                icon={<WalletIcon />}
              />
          )}
          
          <DashboardCard
            title="Obiettivo di Risparmio"
            value={savingsGoal.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
            icon={<PiggyBankIcon />}
            progress={savingsProgress}
          />
          <DashboardCard
            title="Spese Mensili (Stimate)"
            value={monthlyExpenses.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
            icon={<ChartBarIcon />}
          />
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <TransactionList transactions={wealthRecords} />
          {combinedChartData.length > 0 && (
             <BalanceChart data={combinedChartData} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
