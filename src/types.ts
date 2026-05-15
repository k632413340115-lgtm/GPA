export interface Course {
  id: string;
  code?: string;
  name: string;
  credits: number;
  grade10: number;
  letterGrade: string;
  grade4: number;
}

export const GRADE_SCALE = [
  { letter: "A", range: [8.5, 10], gpa: 4.0 },
  { letter: "B", range: [7.0, 8.4], gpa: 3.0 },
  { letter: "C", range: [5.5, 6.9], gpa: 2.0 },
  { letter: "D", range: [4.0, 5.4], gpa: 1.0 },
  { letter: "F", range: [0, 3.9], gpa: 0.0 },
];

export function getLetterAnd4Point(grade10: number) {
  const scale = GRADE_SCALE.find(
    (s) => grade10 >= s.range[0] && grade10 <= s.range[1]
  );
  return scale || { letter: "F", gpa: 0.0 };
}

export function fromLetterTo4Point(letter: string) {
  const scale = GRADE_SCALE.find((s) => s.letter === letter);
  return scale?.gpa || 0.0;
}
