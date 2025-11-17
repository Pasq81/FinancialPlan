
export interface ExtraEvent {
  id: number;
  amount: number;
  age: number;
  description: string;
}

export interface ProjectionDataPoint {
  age: number;
  value: number;
  generalExpenses: number;
  totalExpenses: number;
  pensionIncome?: number;
}

export interface ChartDataPoint {
    age: number;
    'Valore Proiettato'?: number;
    'Obiettivo FIRE (25x)'?: number;
    'Spese Annuali Simulate'?: number;
    'Entrate da Pensione'?: number;
}
