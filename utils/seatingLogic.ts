
import { Constraint, SeatResult } from '../types';

const isValid = (
  currentChart: (string | null)[],
  student: string,
  idx: number,
  rows: number,
  cols: number,
  constraints: Constraint[]
): boolean => {
  const r = Math.floor(idx / cols);
  const c = idx % cols;

  for (const constraint of constraints) {
    // 1. 따로 앉기 (NEGATION)
    if (constraint.type === 'NEGATION') {
      const other = constraint.studentA === student ? constraint.studentB : constraint.studentB === student ? constraint.studentA : null;
      if (!other) continue;

      const otherIdx = currentChart.indexOf(other);
      if (otherIdx !== -1) {
        const r2 = Math.floor(otherIdx / cols);
        const c2 = otherIdx % cols;
        if (Math.abs(r - r2) + Math.abs(c - c2) === 1) return false;
      }
    }

    // 2. 함께 앉기 (TOGETHER)
    if (constraint.type === 'TOGETHER') {
      const other = constraint.studentA === student ? constraint.studentB : constraint.studentB === student ? constraint.studentA : null;
      if (!other) continue;

      const otherIdx = currentChart.indexOf(other);
      if (otherIdx !== -1) {
        const r2 = Math.floor(otherIdx / cols);
        const c2 = otherIdx % cols;
        const isSideBySide = (r === r2) && (Math.abs(c - c2) === 1);
        if (!isSideBySide) return false;
      }
    }
  }
  return true;
};

export const generateSeatingChart = (
  students: string[],
  constraints: Constraint[],
  rows: number,
  cols: number,
  disabledIndices: number[]
): SeatResult => {
  const totalSeats = rows * cols;
  const chart: (string | null)[] = Array(totalSeats).fill(null);

  // 1. 고정석(FIXED_SEAT) 우선 배치
  const fixedConstraints = constraints.filter(c => c.type === 'FIXED_SEAT');
  const fixedStudents = new Set<string>();

  for (const fc of fixedConstraints) {
    if (fc.seatIndex !== undefined && fc.seatIndex >= 0 && fc.seatIndex < totalSeats) {
      if (disabledIndices.includes(fc.seatIndex)) {
        return { chart: [], success: false, error: `${fc.studentA} 학생의 고정 자리가 비어있는 칸입니다.` };
      }
      chart[fc.seatIndex] = fc.studentA;
      fixedStudents.add(fc.studentA);
    }
  }

  const remainingStudents = students.filter(s => !fixedStudents.has(s));
  
  // Shuffle students for randomness
  for (let i = remainingStudents.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remainingStudents[i], remainingStudents[j]] = [remainingStudents[j], remainingStudents[i]];
  }

  const solve = (studentIdx: number): boolean => {
    if (studentIdx >= remainingStudents.length) return true;
    const currentStudent = remainingStudents[studentIdx];

    // Filter available indices
    let availableIndices = Array.from({ length: totalSeats }, (_, i) => i)
      .filter(i => !chart[i] && !disabledIndices.includes(i));
    
    // Shuffle available seats to ensure random distribution among valid seats
    for (let i = availableIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
    }

    for (const idx of availableIndices) {
      if (isValid(chart, currentStudent, idx, rows, cols, constraints)) {
        chart[idx] = currentStudent;
        if (solve(studentIdx + 1)) return true;
        chart[idx] = null;
      }
    }
    return false;
  };

  if (solve(0)) {
    return { chart: chart as string[], success: true };
  } else {
    return { chart: [], success: false, error: '조건을 만족하는 배치를 찾지 못했습니다. 조건을 줄여보세요.' };
  }
};
