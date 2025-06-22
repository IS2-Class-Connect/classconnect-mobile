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
}

export interface AssessmentFilterDto {
  type?: AssessmentType;
  startTimeBegin?: string;
  startTimeEnd?: string;
  day?: string;
}

// 🔸 Nueva interfaz: Submission real
export interface SubmittedAnswer {
  answer: string;
  correction: string;
}

export interface Submission {
  userId: string;
  assesId: string;
  answers: SubmittedAnswer[];
  note?: number;
  feedback?: string;
  AIFeedback?: string;
  submittedAt: string;
  correctedAt?: string;
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
    id: raw.id ?? raw._id,
  };

  return mapped;
}

// ✅ CREATE assessment
export async function createAssessment(
  data: Omit<Assessment, 'id' | 'createdAt' | 'teacherId' | 'courseId'> & {
    exercises: AssessmentExercise[];
  },
  courseId: number,
  userId: string,
  token: string
): Promise<Assessment> {
  const payload = { ...data, userId };
  const response = await postToGateway(`/courses/${courseId}/assessments`, payload, token);
  return response.data as Assessment;
}

// ✅ UPDATE assessment
export async function updateAssessment(
  id: string,
  data: Partial<Omit<Assessment, 'id' | 'createdAt'>> & {
    exercises?: AssessmentExercise[];
  },
  userId: string,
  token: string
): Promise<Assessment> {
  const payload = { ...data, userId };
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

// ✅ SUBMIT assessment (POST /assessments/:id/submissions)
export async function submitAssessment(
  assessmentId: string,
  userId: string,
  answers: string[],
  token: string
): Promise<Submission> {
  const payload = { userId, answers };
  const response = await postToGateway(`/assessments/${assessmentId}/submissions`, payload, token);
  return response.data as Submission;
}

// ✅ GET ALL submissions (GET /assessments/:id/submissions)
export async function getSubmissionsForAssessment(
  assessmentId: string,
  token: string
): Promise<Submission[]> {
  const response = await getFromGateway(`/assessments/${assessmentId}/submissions`, token);
  return response.data as Submission[];
}

// ✅ GET submission of one user (GET /assessments/:id/submissions/:userId)
export async function getUserSubmissionForAssessment(
  assessmentId: string,
  userId: string,
  token: string
): Promise<Submission> {
  const response = await getFromGateway(`/assessments/${assessmentId}/submissions/${userId}`, token);
  return response.data as Submission;
}
export interface Correction {
  assessmentId: string;
  userId: string;
  commentsPerExercise: string[];
  finalNote: number;
  finalComment: string;
  aiSummary?: string; 
}

export async function mockSubmitCorrection(
  assessmentId: string,
  userId: string,
  correction: Omit<Correction, 'aiSummary'>,
  token: string
): Promise<Correction> {
  console.log('📤 Mock POST correction:', { assessmentId, userId, correction, token });

  return {
    ...correction,
    assessmentId,
    userId,
    aiSummary: 'Mocked AI summary based on correction comments.',
  };
}


export async function mockGetCorrection(
  assessmentId: string,
  userId: string,
  token: string
): Promise<Correction> {
  console.log('📥 Mock GET correction:', { assessmentId, userId, token });

  return {
    assessmentId,
    userId,
    commentsPerExercise: ['Well reasoned', 'Incorrect choice', 'Great explanation'],
    finalNote: 8.5,
    finalComment: 'Good performance overall.',
    aiSummary: 'Student showed good understanding with minor mistakes.',
  };
}
