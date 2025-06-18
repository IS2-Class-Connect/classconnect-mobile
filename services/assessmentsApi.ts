import {
  getFromGateway,
  postToGateway,
  patchToGateway,
  deleteFromGateway,
} from './gatewayClient';

export type AssessmentType = 'Exam' | 'Task';
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
  toleranceTime: number;
  startTime: string;
  deadline: string;
  createdAt: string;
  teacherId: string;
  exercises: AssessmentExercise[];
  submissions?: Record<string, AssessmentSubmission>;
}

export interface AssessmentFilterDto {
  type?: AssessmentType;
  startTimeBegin?: string;
  startTimeEnd?: string;
  day?: string;
}

// ✅ GET paginated and filtered assessments
export async function getAssessmentsByCourse(
  courseId: number,
  page: number = 1,
  filters: AssessmentFilterDto = {},
  token: string,
): Promise<{ assessments: Assessment[]; total: number; page: number }> {
  const params = new URLSearchParams();

  if (filters.day) {
    const start = new Date(`${filters.day}T00:00:00.000Z`).toISOString();
    const end = new Date(`${filters.day}T23:59:59.999Z`).toISOString();
    params.append('startTimeBegin', start);
    params.append('startTimeEnd', end);
  }

  if (filters.type) params.append('type', filters.type);

  const queryString = params.toString();
  const response = await getFromGateway(
    `/courses/${courseId}/assessments${queryString ? `?${queryString}` : ''}`,
    token
  );

  const allAssessments = (response.data as any[]).map((a) => ({
    ...a,
    id: a._id,
  })) as Assessment[];

  const PAGE_SIZE = 10;
  const total = allAssessments.length;
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;

  return {
    assessments: allAssessments.slice(startIndex, endIndex),
    total,
    page,
  };
}




// ✅ GET one assessment by ID (mapping _id -> id)
export async function getAssessmentById(
  id: string,
  token: string
): Promise<Assessment> {
  const response = await getFromGateway(`/assessments/${id}`, token);
  const raw = response.data;

  const mapped: Assessment = {
    ...raw,
    id: raw.id ?? raw._id, // Prioriza `id`, si no existe usa `_id`
  };

  return mapped;
}


// ✅ CREATE assessment
// Accepts exercises as an array instead of a record
export async function createAssessment(
  data: Omit<Assessment, 'id' | 'createdAt' | 'submissions' | 'teacherId' | 'courseId'> & {
    exercises: AssessmentExercise[]; // 🔧 Ensure exercises are passed as an array
  },
  courseId: number,
  userId: string,
  token: string
): Promise<Assessment> {
  const payload = { ...data, userId }; // 👤 Attach the userId to the payload
  const response = await postToGateway(`/courses/${courseId}/assessments`, payload, token);
  return response.data as Assessment;
}

// ✅ UPDATE assessment
// Accepts partial updates and exercises as an array
export async function updateAssessment(
  id: string,
  data: Partial<Omit<Assessment, 'id' | 'createdAt' | 'submissions'>> & {
    exercises?: AssessmentExercise[]; // 🔧 Optional array of exercises for update
  },
  userId: string,
  token: string
): Promise<Assessment> {
  const payload = { ...data, userId }; // 👤 Attach the userId to the payload
  const response = await patchToGateway(`/assessments/${id}`, payload, token);
  return response.data as Assessment;
}


// ✅ DELETE assessment
export async function deleteAssessment(
  courseId: number,
  id: string,
  token: string,
  userId: string
): Promise<void> {
  await deleteFromGateway(`/assessments/${id}?userId=${userId}`, token);
}

// ⚠️ MOCKED submission
export async function submitAssessment(
  courseId: number,
  id: string,
  userId: string,
  responses: Record<string, any>
): Promise<AssessmentSubmission> {
  return {
    ...responses,
    note: 7.5,
    feedback: 'Buen trabajo en general.',
  };
}

// ⚠️ MOCKED manual correction
export async function correctAssessmentManually(
  courseId: number,
  id: string,
  userId: string,
  correction: Partial<AssessmentSubmission>
): Promise<AssessmentSubmission> {
  return {
    ...correction,
    note: correction.note ?? 9,
    feedback: correction.feedback ?? 'Corrección manual aplicada.',
  };
}

// ⚠️ MOCKED AI correction
export async function getAIAssessmentCorrection(
  courseId: number,
  id: string,
  userId: string,
  exerciseId: string
): Promise<string> {
  return `AI Score: 8.5. Your explanation is correct, but could benefit from real-world examples.`;
}
