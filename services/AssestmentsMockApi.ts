import { v4 as uuidv4 } from 'uuid';

export type AssessmentType = 'exam' | 'assignment';

export type ExerciseType = 'multiple_choice' | 'open';

export interface AssessmentExercise {
  type: ExerciseType;
  enunciate: string;
  link?: string;
  choices?: string[];
  answer?: string; // sólo para multiple_choice
}

export interface AssessmentSubmission {
  note?: number;
  feedback?: string;
  AI_feedback?: string;
  [exerciseId: string]: any; // respuestas por ejercicio, p. ej. { answer: "..." }
}

export interface Assessment {
  id: string;
  courseId: number;
  moduleId: number;
  title: string;
  description: string;
  type: AssessmentType;
  tolerance_time: number; // en horas
  start_time: string;
  deadline: string;
  created_time: string;
  teacher_id: string;
  exercises: Record<string, AssessmentExercise>;
  submissions: Record<string, AssessmentSubmission>;
}

const mockAssessments: Record<string, Assessment> = {}; // clave: courseId-moduleId-id

function generateKey(courseId: number, moduleId: number, id: string): string {
  return `${courseId}-${moduleId}-${id}`;
}

// Crear una evaluación
export async function createAssessment(
  data: Omit<Assessment, 'id' | 'created_time' | 'submissions'>
): Promise<Assessment> {
  const id = uuidv4();
  const created_time = new Date().toISOString();
  const full: Assessment = {
    ...data,
    id,
    created_time,
    submissions: {},
  };
  mockAssessments[generateKey(data.courseId, data.moduleId, id)] = full;
  return full;
}

// Editar evaluación
export async function updateAssessment(
  courseId: number,
  moduleId: number,
  id: string,
  data: Partial<Omit<Assessment, 'id' | 'created_time' | 'submissions'>>
): Promise<Assessment> {
  const key = generateKey(courseId, moduleId, id);
  if (!mockAssessments[key]) throw new Error('Assessment not found');
  mockAssessments[key] = { ...mockAssessments[key], ...data };
  return mockAssessments[key];
}

// Eliminar evaluación
export async function deleteAssessment(
  courseId: number,
  moduleId: number,
  id: string
): Promise<void> {
  const key = generateKey(courseId, moduleId, id);
  delete mockAssessments[key];
}

// Obtener todas las evaluaciones de un curso + módulo
export async function getAssessmentsByCourseModule(
  courseId: number,
  moduleId: number
): Promise<Assessment[]> {
  return Object.values(mockAssessments).filter(
    (a) => a.courseId === courseId && a.moduleId === moduleId
  );
}

// Enviar respuesta como alumno
export async function submitAssessment(
  courseId: number,
  moduleId: number,
  id: string,
  userId: string,
  responses: Record<string, any>
): Promise<AssessmentSubmission> {
  const key = generateKey(courseId, moduleId, id);
  const assessment = mockAssessments[key];
  if (!assessment) throw new Error('Assessment not found');

  assessment.submissions[userId] = {
    ...assessment.submissions[userId],
    ...responses,
  };

  return assessment.submissions[userId];
}

// Corrección manual por docente
export async function correctAssessmentManually(
  courseId: number,
  moduleId: number,
  id: string,
  userId: string,
  correction: Partial<AssessmentSubmission>
): Promise<AssessmentSubmission> {
  const key = generateKey(courseId, moduleId, id);
  const assessment = mockAssessments[key];
  if (!assessment || !assessment.submissions[userId]) throw new Error('Submission not found');

  assessment.submissions[userId] = {
    ...assessment.submissions[userId],
    ...correction,
  };

  return assessment.submissions[userId];
}

// Corrección automática por IA de un ejercicio
export async function getAIAssessmentCorrection(
  courseId: number,
  moduleId: number,
  id: string,
  userId: string,
  exerciseId: string
): Promise<string> {
  const key = generateKey(courseId, moduleId, id);
  const answer = mockAssessments[key]?.submissions[userId]?.[exerciseId]?.answer;

  if (!answer) return 'No answer provided.';

  // IA simulada
  return `AI Score: 8.5. Your explanation is correct, but could benefit from real-world examples.`;
}
