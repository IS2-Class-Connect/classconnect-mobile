import { v4 as uuidv4 } from 'uuid';

export type AssessmentType = 'exam' | 'assignment';
export type ExerciseType = 'multiple_choice' | 'open';

export interface AssessmentExercise {
  type: ExerciseType;
  enunciate: string;
  link?: string;
  choices?: string[];
  answer?: string;
}

export interface AssessmentSubmission {
  note?: number;
  feedback?: string;
  AI_feedback?: string;
  [exerciseId: string]: any;
}

export interface Assessment {
  id: string;
  courseId: number;
  title: string;
  description: string;
  type: AssessmentType;
  tolerance_time: number;
  start_time: string;
  deadline: string;
  created_time: string;
  teacher_id: string;
  exercises: Record<string, AssessmentExercise>;
  submissions: Record<string, AssessmentSubmission>;
}

const mockAssessments: Record<string, Assessment> = {};
const PAGE_SIZE = 10;

function generateKey(courseId: number, id: string): string {
  return `${courseId}-${id}`;
}

function safeDate(input?: string): Date | null {
  return input ? new Date(input) : null;
}

export interface AssessmentFilter {
  type?: AssessmentType;
  title?: string;
  fromDate?: string; // ISO string
  toDate?: string;   // ISO string
  status?: 'upcoming' | 'open' | 'closed';
}

// Crear evaluación
export async function createAssessment(
  data: Omit<Assessment, 'id' | 'created_time' | 'submissions' | 'teacher_id'>,
  userId: string
): Promise<Assessment> {
  const id = uuidv4();
  const created_time = new Date().toISOString();
  const full: Assessment = {
    ...data,
    id,
    created_time,
    teacher_id: userId,
    submissions: {},
  };
  mockAssessments[generateKey(data.courseId, id)] = full;
  return full;
}

// Editar evaluación
export async function updateAssessment(
  courseId: number,
  id: string,
  data: Partial<Omit<Assessment, 'id' | 'created_time' | 'submissions'>>,
  userId: string
): Promise<Assessment> {
  const key = generateKey(courseId, id);
  if (!mockAssessments[key]) throw new Error('Assessment not found');
  mockAssessments[key] = {
    ...mockAssessments[key],
    ...data,
    teacher_id: userId,
  };
  return mockAssessments[key];
}

// Eliminar evaluación
export async function deleteAssessment(
  courseId: number,
  id: string
): Promise<void> {
  const key = generateKey(courseId, id);
  delete mockAssessments[key];
}

// Obtener evaluaciones con paginación + filtros
export async function getAssessmentsByCourse(
  courseId: number,
  page: number = 1,
  filters: AssessmentFilter = {}
): Promise<{ assessments: Assessment[]; total: number; page: number }> {
  let filtered = Object.values(mockAssessments).filter(
    (a) => a.courseId === courseId
  );

  const now = new Date();
  const from = safeDate(filters.fromDate);
  const to = safeDate(filters.toDate);

  if (filters.type) {
    filtered = filtered.filter((a) => a.type === filters.type);
  }

  if (filters.title) {
    const title = filters.title.toLowerCase();
    filtered = filtered.filter((a) => a.title.toLowerCase().includes(title));
  }

  if (from) {
    filtered = filtered.filter((a) => new Date(a.start_time) >= from);
  }

  if (to) {
    filtered = filtered.filter((a) => new Date(a.start_time) <= to);
  }

  if (filters.status) {
    filtered = filtered.filter((a) => {
      const start = new Date(a.start_time);
      const end = new Date(a.deadline);
      switch (filters.status) {
        case 'upcoming':
          return now < start;
        case 'open':
          return now >= start && now <= end;
        case 'closed':
          return now > end;
      }
    });
  }

  const total = filtered.length;
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  return {
    assessments: filtered.slice(start, end),
    total,
    page,
  };
}

// Enviar respuesta
export async function submitAssessment(
  courseId: number,
  id: string,
  userId: string,
  responses: Record<string, any>
): Promise<AssessmentSubmission> {
  const key = generateKey(courseId, id);
  const assessment = mockAssessments[key];
  if (!assessment) throw new Error('Assessment not found');
  assessment.submissions[userId] = {
    ...assessment.submissions[userId],
    ...responses,
  };
  return assessment.submissions[userId];
}

// Corrección manual
export async function correctAssessmentManually(
  courseId: number,
  id: string,
  userId: string,
  correction: Partial<AssessmentSubmission>
): Promise<AssessmentSubmission> {
  const key = generateKey(courseId, id);
  const assessment = mockAssessments[key];
  if (!assessment || !assessment.submissions[userId]) throw new Error('Submission not found');
  assessment.submissions[userId] = {
    ...assessment.submissions[userId],
    ...correction,
  };
  return assessment.submissions[userId];
}

// Corrección IA simulada
export async function getAIAssessmentCorrection(
  courseId: number,
  id: string,
  userId: string,
  exerciseId: string
): Promise<string> {
  const key = generateKey(courseId, id);
  const answer = mockAssessments[key]?.submissions[userId]?.[exerciseId]?.answer;
  if (!answer) return 'No answer provided.';
  return `AI Score: 8.5. Your explanation is correct, but could benefit from real-world examples.`;
}
