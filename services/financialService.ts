import { ExtraEvent, ProjectionDataPoint } from '../types';

// Helper for Monte Carlo simulation
const normalDistribution = (mean: number, stdDev: number): number => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); 
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * stdDev;
};

export const calculateInflated = (initialValue: number, inflationRate: number, years: number): number => {
    return initialValue * Math.pow(1 + inflationRate, years);
};

interface MonteCarloParams {
    initialPortfolio: number;
    retirementDurationYears: number;
    meanReturn: number;
    stdDev: number;
    simulations: number;
    initialAnnualGeneralWithdrawal: number;
    fixedAnnualMortgage: number;
    retirementAge: number;
    mortgageEndAge: number;
    annualInflation: number;
    pensionAtStartAge: number; // Renamed for clarity
    pensionStartAge: number;
    pensionRevaluationRate: number; // New parameter
    extraIncomes: ExtraEvent[];
    extraExpenses: ExtraEvent[];
}

export const runMonteCarloSimulation = (params: MonteCarloParams): number => {
    const {
        initialPortfolio, retirementDurationYears, meanReturn, stdDev, simulations,
        initialAnnualGeneralWithdrawal, fixedAnnualMortgage, retirementAge, mortgageEndAge,
        annualInflation, pensionAtStartAge, pensionStartAge, pensionRevaluationRate, 
        extraIncomes, extraExpenses
    } = params;

    let successCount = 0;

    for (let i = 0; i < simulations; i++) {
        let portfolio = initialPortfolio;
        let survived = true;
        let currentAnnualGeneralWithdrawal = initialAnnualGeneralWithdrawal;
        let currentAnnualPension = pensionAtStartAge; 
        
        for (let year = 1; year <= retirementDurationYears; year++) {
            const currentAgeInRetirement = retirementAge + year;
            
            const annualReturn = normalDistribution(meanReturn, stdDev);
            const monthlyReturnRate = annualReturn / 12;

            let netExtraCashFlow = 0;
            extraIncomes.forEach(income => {
                if (income.age === currentAgeInRetirement && income.amount > 0) netExtraCashFlow += income.amount;
            });
            extraExpenses.forEach(expense => {
                if (expense.age === currentAgeInRetirement && expense.amount > 0) netExtraCashFlow -= expense.amount;
            });
            portfolio += netExtraCashFlow;

            let annualExpenses = currentAnnualGeneralWithdrawal;
            if (currentAgeInRetirement <= mortgageEndAge) annualExpenses += fixedAnnualMortgage; 
            
            let pensionContribution = 0;
            if (currentAgeInRetirement >= pensionStartAge) pensionContribution = currentAnnualPension;

            const annualNetWithdrawal = Math.max(0, annualExpenses - pensionContribution);
            const monthlyNetWithdrawal = annualNetWithdrawal / 12;

            for (let month = 0; month < 12; month++) {
                portfolio *= (1 + monthlyReturnRate);
                portfolio -= monthlyNetWithdrawal;
                if (portfolio <= 0) {
                    portfolio = 0;
                    survived = false;
                    break;
                }
            }
            if (!survived) break;

            currentAnnualGeneralWithdrawal *= (1 + annualInflation);
            if (currentAgeInRetirement >= pensionStartAge) {
                // Use the new dedicated revaluation rate for pension
                currentAnnualPension *= (1 + pensionRevaluationRate);
            }
        }
        if (survived) successCount++;
    }
    return successCount / simulations;
};

interface AccumulationParams {
    initialValue: number;
    initialMonthlyContribution: number;
    annualReturn: number;
    annualInflation: number;
    years: number;
    startAge: number;
    initialGeneralExpenses: number;
    fixedAnnualMortgage: number;
    mortgageEndAge: number;
    extraIncomes: ExtraEvent[];
    extraExpenses: ExtraEvent[];
}

export const calculateAccumulationPhase = (params: AccumulationParams): { finalValue: number, annualData: ProjectionDataPoint[] } => {
    const { initialValue, initialMonthlyContribution, annualReturn, annualInflation, years, startAge,
            initialGeneralExpenses, fixedAnnualMortgage, mortgageEndAge, extraIncomes, extraExpenses } = params;
            
    const monthlyRate = annualReturn / 12;
    let fv = initialValue;
    let currentMonthlyContribution = initialMonthlyContribution;
    let currentGeneralExpenses = initialGeneralExpenses; 
    
    const annualData: ProjectionDataPoint[] = [{ 
        age: startAge, 
        value: initialValue,
        generalExpenses: initialGeneralExpenses,
        totalExpenses: initialGeneralExpenses + fixedAnnualMortgage
    }];

    for (let year = 1; year <= years; year++) { 
        const currentAge = startAge + year;

        let netExtraCashFlow = 0;
        extraIncomes.forEach(income => {
            if (income.age === currentAge && income.amount > 0) netExtraCashFlow += income.amount;
        });
        extraExpenses.forEach(expense => {
            if (expense.age === currentAge && expense.amount > 0) netExtraCashFlow -= expense.amount;
        });
        fv += netExtraCashFlow;

        currentGeneralExpenses *= (1 + annualInflation);
        
        let totalAnnualExpenses = currentGeneralExpenses;
        if (currentAge <= mortgageEndAge) totalAnnualExpenses += fixedAnnualMortgage; 

        for (let month = 0; month < 12; month++) {
            fv = fv * (1 + monthlyRate) + currentMonthlyContribution;
        }
        
        currentMonthlyContribution *= (1 + annualInflation);

        annualData.push({ 
            age: currentAge, 
            value: Math.round(fv),
            generalExpenses: Math.round(currentGeneralExpenses),
            totalExpenses: Math.round(totalAnnualExpenses) 
        }); 
    }
    return { finalValue: fv, annualData };
};

interface DecumulationParams {
    startValue: number;
    initialAnnualGeneralWithdrawal: number;
    fixedAnnualMortgage: number;
    annualReturn: number;
    annualInflation: number;
    duration: number;
    retirementAge: number;
    mortgageEndAge: number;
    pensionAtStartAge: number; // Renamed for clarity
    pensionStartAge: number;
    pensionRevaluationRate: number; // New parameter
    extraIncomes: ExtraEvent[];
    extraExpenses: ExtraEvent[];
}

export const calculateDecumulationPhase = (params: DecumulationParams): ProjectionDataPoint[] => {
    const { startValue, initialAnnualGeneralWithdrawal, fixedAnnualMortgage, annualReturn, annualInflation,
            duration, retirementAge, mortgageEndAge, pensionAtStartAge, pensionStartAge, pensionRevaluationRate,
            extraIncomes, extraExpenses } = params;
            
    const monthlyReturnRate = annualReturn / 12;
    let currentPortfolio = startValue;
    let currentAnnualGeneralWithdrawal = initialAnnualGeneralWithdrawal;
    const decumulationData: ProjectionDataPoint[] = [];
    
    // The pension value is already estimated for the start age, no initial inflation needed.
    let currentAnnualPension = pensionAtStartAge;

    for (let year = 1; year <= duration; year++) {
        const currentAgeInRetirement = retirementAge + year;
        
        let totalAnnualExpenses = currentAnnualGeneralWithdrawal; 
        if (currentAgeInRetirement <= mortgageEndAge) totalAnnualExpenses += fixedAnnualMortgage; 

        let pensionContribution = 0;
        if (currentAgeInRetirement >= pensionStartAge) pensionContribution = currentAnnualPension;
        
        const annualNetWithdrawal = Math.max(0, totalAnnualExpenses - pensionContribution);
        const monthlyNetWithdrawal = annualNetWithdrawal / 12;

        for (let month = 0; month < 12; month++) {
            currentPortfolio *= (1 + monthlyReturnRate);
            currentPortfolio -= monthlyNetWithdrawal;
            if (currentPortfolio <= 0) {
                currentPortfolio = 0;
                break;
            }
        }
        
        let netExtraCashFlow = 0;
        extraIncomes.forEach(income => {
            if (income.age === currentAgeInRetirement && income.amount > 0) netExtraCashFlow += income.amount;
        });
        extraExpenses.forEach(expense => {
            if (expense.age === currentAgeInRetirement && expense.amount > 0) netExtraCashFlow -= expense.amount;
        });
        currentPortfolio += netExtraCashFlow;

        currentAnnualGeneralWithdrawal *= (1 + annualInflation);
        // Use the new dedicated revaluation rate for pension
        if (currentAgeInRetirement >= pensionStartAge) currentAnnualPension *= (1 + pensionRevaluationRate);

        decumulationData.push({ 
            age: currentAgeInRetirement, 
            value: Math.round(currentPortfolio),
            generalExpenses: Math.round(currentAnnualGeneralWithdrawal / (1 + annualInflation)), 
            totalExpenses: Math.round(totalAnnualExpenses),
            pensionIncome: Math.round(pensionContribution)
        });

        if (currentPortfolio === 0) break;
    }
    
    return decumulationData;
};
