
export type ConstraintType = 'NEGATION' | 'TOGETHER' | 'FIXED_SEAT';

export interface Constraint {
  type: ConstraintType;
  studentA: string;
  studentB?: string;
  seatIndex?: number; // 0-based index for FIXED_SEAT
}

export interface SeatResult {
  chart: string[];
  success: boolean;
  error?: string;
}

export interface GeneratedClassData {
  names: string[];
  conflicts: string[];
}
