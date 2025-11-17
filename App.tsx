
import React, { useState, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ExtraEvent, ProjectionDataPoint, ChartDataPoint } from './types';
import { runMonteCarloSimulation, calculateAccumulationPhase, calculateDecumulationPhase, calculateInflated } from './services/financialService';
import InputGroup from './components/InputGroup';
import ResultCard from './components/ResultCard';
import CustomTooltip from './components/CustomTooltip';

const App: React.FC = () => {
    // STATE
    const [isInputCollapsed, setIsInputCollapsed] = useState(false); 
    const [isExtraEventsCollapsed, setIsExtraEventsCollapsed] = useState(true);

    // User Data
    const [currentAge, setCurrentAge] = useState<number>(44); 
    const [currentSavings, setCurrentSavings] = useState<number>(250000);
    const [monthlyContribution, setMonthlyContribution] = useState<number>(1000);
    const [yearsToRetirement, setYearsToRetirement] = useState<number>(15);

    // Expenses & Pension
    const [generalAnnualExpenses, setGeneralAnnualExpenses] = useState<number>(20200); 
    const [monthlyMortgagePayment, setMonthlyMortgagePayment] = useState<number>(550); 
    const [remainingMortgageYears, setRemainingMortgageYears] = useState<number>(15); 
    const [pensionStartAge, setPensionStartAge] = useState<number>(67);
    const [annualPensionIncome, setAnnualPensionIncome] = useState<number>(12000); 

    // Extra Events
    const [extraIncomes, setExtraIncomes] = useState<ExtraEvent[]>([
        { id: 1, amount: 0, age: 60, description: 'Liquidazione Fondo Pensione 1' },
        { id: 2, amount: 0, age: 65, description: 'Liquidazione Fondo Pensione 2' },
        { id: 3, amount: 0, age: 75, description: 'Entrata Addizionale Eredità' },
    ]);
    const [extraExpenses, setExtraExpenses] = useState<ExtraEvent[]>([
        { id: 1, amount: 0, age: 50, description: 'Ristrutturazione Casa' },
        { id: 2, amount: 0, age: 60, description: 'Spese Università Figli' },
        { id: 3, amount: 0, age: 70, description: 'Uscita Medica Straordinaria' },
    ]);
    
    // Financial Assumptions
    const [grossAnnualReturn, setGrossAnnualReturn] = useState<number>(0.07); 
    const [annualInflation, setAnnualInflation] = useState<number>(0.02); 
    const [capitalGainsTaxRate, setCapitalGainsTaxRate] = useState<number>(0.26); 
    const [pensionRevaluationRate, setPensionRevaluationRate] = useState<number>(0.015); // New state

    // Monte Carlo Settings
    const [simGrossMeanReturn, setSimGrossMeanReturn] = useState<number>(0.08); 
    const [simStdDev, setSimStdDev] = useState<number>(0.12); 
    const [retirementDuration, setRetirementDuration] = useState<number>(30); 

    // Results
    const [projectedValue, setProjectedValue] = useState<number | null>(null);
    const [inflatedExpenses, setInflatedExpenses] = useState<number | null>(null); 
    const [fireProbability, setFireProbability] = useState<number | null>(null);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [projectionData, setProjectionData] = useState<ProjectionDataPoint[]>([]);

    const handleNumericChange = (setter: React.Dispatch<React.SetStateAction<number>>, isRate: boolean = false) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setter(isNaN(value) ? 0 : (isRate ? value / 100 : value));
    };
    
    const updateExtraEvents = (id: number, field: keyof ExtraEvent, value: string | number, isIncome: boolean) => {
        const setter = isIncome ? setExtraIncomes : setExtraExpenses;
        setter(prev => prev.map(item => 
            item.id === id ? { ...item, [field]: (typeof value === 'string' ? value : Number(value)) } : item
        ));
    };

    const handleCalculate = useCallback(async () => {
        setIsCalculating(true);
        setProjectedValue(null);
        setFireProbability(null);
        setProjectionData([]); 

        // Derived constants for calculation
        const retirementAge = currentAge + yearsToRetirement;
        const decumulationDuration = Math.max(0, 100 - retirementAge);
        const annualMortgageValue = monthlyMortgagePayment * 12;
        const mortgageEndAge = currentAge + remainingMortgageYears;
        const netAnnualReturn = grossAnnualReturn * (1 - capitalGainsTaxRate);
        const simNetMeanReturn = simGrossMeanReturn * (1 - capitalGainsTaxRate);

        try {
            const inflatedGeneralExpensesResult = calculateInflated(generalAnnualExpenses, annualInflation, yearsToRetirement);
            setInflatedExpenses(inflatedGeneralExpensesResult + (retirementAge < mortgageEndAge ? annualMortgageValue : 0)); 
            
            const { finalValue, annualData: accumulationData } = calculateAccumulationPhase({
                initialValue: currentSavings,
                initialMonthlyContribution: monthlyContribution,
                annualReturn: netAnnualReturn,
                annualInflation, 
                years: yearsToRetirement,
                startAge: currentAge,
                initialGeneralExpenses: generalAnnualExpenses,
                fixedAnnualMortgage: annualMortgageValue,
                mortgageEndAge,
                extraIncomes,
                extraExpenses
            });
            setProjectedValue(finalValue);

            const decumulationData = calculateDecumulationPhase({
                startValue: finalValue,
                initialAnnualGeneralWithdrawal: inflatedGeneralExpensesResult, 
                fixedAnnualMortgage: annualMortgageValue,          
                annualReturn: netAnnualReturn,
                annualInflation,
                duration: decumulationDuration, 
                retirementAge, 
                mortgageEndAge,
                pensionAtStartAge: annualPensionIncome, // Pass the direct value
                pensionStartAge,
                pensionRevaluationRate, // Pass the new rate
                extraIncomes,
                extraExpenses
            });
            
            setProjectionData([...accumulationData, ...decumulationData]);

            const probability = runMonteCarloSimulation({
                initialPortfolio: finalValue,
                retirementDurationYears: decumulationDuration, 
                meanReturn: simNetMeanReturn, 
                stdDev: simStdDev,
                simulations: 5000,
                initialAnnualGeneralWithdrawal: inflatedGeneralExpensesResult, 
                fixedAnnualMortgage: annualMortgageValue,
                retirementAge,
                mortgageEndAge,
                annualInflation,
                pensionAtStartAge: annualPensionIncome, // Pass the direct value
                pensionStartAge,
                pensionRevaluationRate, // Pass the new rate
                extraIncomes,
                extraExpenses
            });
            setFireProbability(probability);

        } catch (e) {
            console.error("Calculation error:", e);
        } finally {
            setIsCalculating(false);
        }
    }, [
        currentAge, currentSavings, monthlyContribution, grossAnnualReturn, yearsToRetirement,
        generalAnnualExpenses, monthlyMortgagePayment, remainingMortgageYears, annualInflation, 
        pensionStartAge, annualPensionIncome, pensionRevaluationRate, simGrossMeanReturn, 
        simStdDev, capitalGainsTaxRate, extraIncomes, extraExpenses
    ]);

    const targetFIRE = useMemo(() => {
        if (inflatedExpenses === null) return 0;
        
        let annualNeed = inflatedExpenses; 
        const retirementAge = currentAge + yearsToRetirement;
        let pensionContributionAtRetirement = 0;

        if (pensionStartAge <= retirementAge) {
            const yearsSincePensionStart = retirementAge - pensionStartAge;
            pensionContributionAtRetirement = annualPensionIncome * Math.pow(1 + pensionRevaluationRate, yearsSincePensionStart);
        }

        annualNeed = Math.max(0, annualNeed - pensionContributionAtRetirement);
        return annualNeed * 25; 

    }, [inflatedExpenses, annualPensionIncome, pensionRevaluationRate, currentAge, yearsToRetirement, pensionStartAge]);

    const chartData = useMemo((): ChartDataPoint[] => {
        if (projectionData.length === 0) return [];
        const targetValue = targetFIRE; 
        
        return projectionData.map(d => ({
            age: d.age,
            'Valore Proiettato': d.value,
            'Obiettivo FIRE (25x)': targetValue,
            'Spese Annuali Simulate': d.totalExpenses, 
            'Entrate da Pensione': d.pensionIncome || 0
        }));
    }, [projectionData, targetFIRE]);

    const formatCurrency = (value: number | null) => {
        if (value === null) return 'N/D';
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    };

    const formatPercent = (value: number | null) => {
        if (value === null) return 'N/D';
        return new Intl.NumberFormat('it-IT', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
    };

    const formatAxisCurrency = (tick: number): string => {
        if (typeof tick !== 'number' || isNaN(tick)) return '';
        if (Math.abs(tick) >= 1_000_000) {
            return `€${(tick / 1_000_000).toLocaleString('it-IT', {minimumFractionDigits: 1, maximumFractionDigits: 1})}M`;
        }
        if (Math.abs(tick) >= 1_000) {
            return `€${(tick / 1_000).toLocaleString('it-IT', {minimumFractionDigits: 0, maximumFractionDigits: 0})}k`;
        }
        return `€${tick.toLocaleString('it-IT')}`;
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-sky-400">
                        FIRE Financial Calculator
                    </h1>
                    <p className="text-gray-400 mt-2">Pianifica la tua indipendenza finanziaria.</p>
                </header>

                <main>
                    {/* Input Sections */}
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-4">
                        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsInputCollapsed(!isInputCollapsed)}>
                            <h2 className="text-2xl font-semibold text-sky-400">I tuoi Dati Finanziari</h2>
                            <button className="p-2 rounded-full text-gray-300 hover:bg-gray-700 transition duration-150">
                                <svg className={`w-6 h-6 transform transition-transform duration-300 ${isInputCollapsed ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                                </svg>
                            </button>
                        </div>
                        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isInputCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100 mt-4'}`}>
                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-xl font-medium text-gray-300 mb-4">Dati Base</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                    <InputGroup label="Età Attuale (Anni)" value={currentAge} onChange={handleNumericChange(setCurrentAge)} type="number" />
                                    <InputGroup label="Risparmi Attuali (€)" value={currentSavings} onChange={handleNumericChange(setCurrentSavings)} type="number" />
                                    <InputGroup label="Contributo Mensile (€)" value={monthlyContribution} onChange={handleNumericChange(setMonthlyContribution)} type="number" tooltip="Questo contributo sarà aumentato annualmente in base all'inflazione." />
                                    <InputGroup label="Anni al Ritiro" value={yearsToRetirement} onChange={handleNumericChange(setYearsToRetirement)} type="number" />
                                </div>

                                <h3 className="text-xl font-medium text-gray-300 mb-4">Spese & Pensione</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <InputGroup label="Spese Generali Annuali (€)" value={generalAnnualExpenses} onChange={handleNumericChange(setGeneralAnnualExpenses)} type="number" tooltip="Spese odierne soggette a inflazione (cibo, utenze, ecc.)." />
                                    <InputGroup label="Rata Mutuo Mensile (€)" value={monthlyMortgagePayment} onChange={handleNumericChange(setMonthlyMortgagePayment)} type="number" tooltip="Rata fissa mensile, non soggetta a inflazione." />
                                    <InputGroup label="Anni Residui Mutuo" value={remainingMortgageYears} onChange={handleNumericChange(setRemainingMortgageYears)} type="number" />
                                    <InputGroup label="Pensione Annua (al ritiro, €)" value={annualPensionIncome} onChange={handleNumericChange(setAnnualPensionIncome)} type="number" tooltip="Importo stimato per il primo anno di pensione. Non è un valore odierno." />
                                    <InputGroup label="Età Inizio Pensione" value={pensionStartAge} onChange={handleNumericChange(setPensionStartAge)} type="number" />
                                </div>
                                
                                <h3 className="text-xl font-medium text-gray-300 mb-4">Assunzioni Finanziarie</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <InputGroup label="Rendimento LORDO (%)" value={grossAnnualReturn * 100} onChange={handleNumericChange(setGrossAnnualReturn, true)} type="number" step="0.1" />
                                    <InputGroup label="Inflazione Annua Stimata (%)" value={annualInflation * 100} onChange={handleNumericChange(setAnnualInflation, true)} type="number" step="0.1" />
                                    <InputGroup label="Tassazione Plusvalenze (%)" value={capitalGainsTaxRate * 100} onChange={handleNumericChange(setCapitalGainsTaxRate, true)} type="number" step="0.1" />
                                    <InputGroup label="Rivalutazione Pensione (%)" value={pensionRevaluationRate * 100} onChange={handleNumericChange(setPensionRevaluationRate, true)} type="number" step="0.1" tooltip="Tasso di rivalutazione annuo della pensione durante il pensionamento." />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-4">
                        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExtraEventsCollapsed(!isExtraEventsCollapsed)}>
                            <h2 className="text-2xl font-semibold text-pink-400">Eventi di Cassa Extra (Una Tantum)</h2>
                            <button className="p-2 rounded-full text-gray-300 hover:bg-gray-700 transition duration-150">
                                <svg className={`w-6 h-6 transform transition-transform duration-300 ${isExtraEventsCollapsed ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                            </button>
                        </div>
                         <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExtraEventsCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100 mt-4'}`}>
                            <p className="text-sm text-gray-400 mb-4 border-t border-gray-700 pt-4">Flussi di cassa fissi (non inflazionati) che si verificano una sola volta all'età specificata.</p>
                            <h3 className="text-xl font-medium text-green-400 mb-3">Entrate Extra (Cash In)</h3>
                            {extraIncomes.map(income => (
                                <div key={income.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 items-end">
                                    <InputGroup label={`Descrizione`} value={income.description} onChange={e => updateExtraEvents(income.id, 'description', e.target.value, true)} type="text" />
                                    <InputGroup label="Importo (€)" value={income.amount} onChange={e => updateExtraEvents(income.id, 'amount', e.target.value, true)} type="number" />
                                    <InputGroup label="Età" value={income.age} onChange={e => updateExtraEvents(income.id, 'age', e.target.value, true)} type="number" />
                                </div>
                            ))}
                            <h3 className="text-xl font-medium text-red-400 mb-3 mt-6">Uscite Extra (Cash Out)</h3>
                            {extraExpenses.map(expense => (
                                <div key={expense.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 items-end">
                                    <InputGroup label={`Descrizione`} value={expense.description} onChange={e => updateExtraEvents(expense.id, 'description', e.target.value, false)} type="text" />
                                    <InputGroup label="Importo (€)" value={expense.amount} onChange={e => updateExtraEvents(expense.id, 'amount', e.target.value, false)} type="number" />
                                    <InputGroup label="Età" value={expense.age} onChange={e => updateExtraEvents(expense.id, 'age', e.target.value, false)} type="number" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleCalculate} disabled={isCalculating} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-xl shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-8">
                        {isCalculating ? (<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>) : 'Calcola Proiezione'}
                    </button>

                    {/* Results & Chart */}
                    {projectionData.length > 0 && (
                        <>
                            <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
                                <h2 className="text-2xl font-semibold text-sky-400 mb-4">Riepilogo Risultati</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-700/50 p-4 rounded-lg">
                                        <span className="font-medium text-gray-300 block">Spese Annue al Ritiro</span>
                                        <span className="text-2xl font-bold text-sky-300">{formatCurrency(inflatedExpenses)}</span>
                                    </div>
                                    <div className="bg-gray-700/50 p-4 rounded-lg">
                                        <span className="font-medium text-gray-300 block">Obiettivo FIRE (25x)</span>
                                        <span className="text-2xl font-bold text-sky-300">{formatCurrency(targetFIRE)}</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <ResultCard title="Valore Proiettato al Ritiro (Deterministico, NETTO)" value={formatCurrency(projectedValue)} description={`Età di ritiro: ${currentAge + yearsToRetirement}. Rendimento NETTO annuo atteso: ${formatPercent(grossAnnualReturn * (1 - capitalGainsTaxRate))}.`} isGood={projectedValue !== null && projectedValue >= targetFIRE} comparisonText={projectedValue !== null && projectedValue >= targetFIRE ? "Obiettivo Raggiunto!" : `Mancano ${formatCurrency(targetFIRE - (projectedValue || 0))} per l'obiettivo.`} />
                                    <ResultCard title="Probabilità di Successo FIRE (Monte Carlo)" value={formatPercent(fireProbability)} description={`Probabilità che il portafoglio duri fino a 100 anni, considerando pensione, mutuo ed eventi extra.`} isGood={fireProbability !== null && fireProbability >= 0.95} comparisonText={fireProbability !== null && fireProbability >= 0.95 ? "Probabilità Eccellente!" : "Probabilità migliorabile."} />
                                </div>
                            </div>

                            <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
                                <h2 className="text-2xl font-semibold text-sky-400 mb-4">Proiezione del Portafoglio</h2>
                                <div className="h-96 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                                            <YAxis yAxisId="left" stroke="#D1D5DB" tickFormatter={formatAxisCurrency} domain={['dataMin', 'auto']} />
                                            <YAxis yAxisId="right" orientation="right" stroke="#E333FF" tickFormatter={formatAxisCurrency} />
                                            <XAxis dataKey="age" stroke="#D1D5DB" type="number" domain={['dataMin', 'auto']} label={{ value: `Età`, position: 'insideBottom', dy: 15, fill: '#D1D5DB' }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ color: '#D1D5DB' }} />
                                            <Line yAxisId="left" type="monotone" dataKey="Valore Proiettato" stroke="#0ea5e9" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                            <Line yAxisId="left" type="monotone" dataKey="Obiettivo FIRE (25x)" stroke="#f59e0b" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                                            <Line yAxisId="right" type="monotone" dataKey="Spese Annuali Simulate" stroke="#d946ef" strokeDasharray="2 2" dot={false} strokeWidth={1} />
                                            <Line yAxisId="right" type="monotone" dataKey="Entrate da Pensione" stroke="#10b981" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    )}

                     <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-semibold text-sky-400 mb-4">Impostazioni Monte Carlo</h2>
                        <p className="text-sm text-gray-400 mb-4">I rendimenti qui sono LORDI e saranno tassati al {formatPercent(capitalGainsTaxRate)} per la simulazione.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <InputGroup label="Rendimento Medio LORDO (%)" value={simGrossMeanReturn * 100} onChange={handleNumericChange(setSimGrossMeanReturn, true)} type="number" step="0.1" />
                            <InputGroup label="Deviazione Standard (σ) (%)" value={simStdDev * 100} onChange={handleNumericChange(setSimStdDev, true)} type="number" step="0.1" />
                            <InputGroup label="Durata Ritiro (Anni)" value={retirementDuration} onChange={handleNumericChange(setRetirementDuration)} type="number" tooltip="Questo valore è solo per riferimento. La simulazione usa la durata fino a 100 anni." />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
