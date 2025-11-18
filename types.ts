
export interface WealthRecord {
  id: number;
  year: number;
  amount: number;
  note?: string;
}

// Alias for backward compatibility if needed, though we are refactoring usage
export type Transaction = WealthRecord;

export interface ChartDataPoint {
  eta: number;
  anno: number;
  spesaMutuo: number;
  spesaTotale: number;
  patrimonio?: number;
}
