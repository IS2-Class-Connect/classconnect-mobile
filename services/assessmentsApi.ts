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

export interface AssessmentQueryDto {
  type?: AssessmentType;
  startTimeBegin?: string;
  startTimeEnd?: string;
  deadlineBegin?: string;
  deadlineEnd?: string;
  page?: number;
  limit?: number;
}

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

// 🔹 Get assessments with filters and pagination
// 🔹 Get assessments with filters and pagination
export async function getAssessmentsByCourse(
  courseId: number,
  page: number = 1,
  token: string,
  day?: string,
  type: 'Exam' | 'Task' = 'Exam',
): Promise<{ assessments: Assessment[]; total: number; page: number }> {
  const params = new URLSearchParams();

  // Add day filter if provided
  if (day) {
    const start = new Date(`${day}T00:00:00.000Z`).toISOString();
    const end = new Date(`${day}T23:59:59.999Z`).toISOString();
    params.append('startTimeBegin', start);
    params.append('startTimeEnd', end);
  }

  // Add type filter (Exam/Task)
  params.append('type', type);

  // Add pagination filters
  params.append('page', String(page));
  params.append('limit', String(10)); // default limit is 10, adjust as necessary

  const queryString = params.toString();
  const response = await getFromGateway(
    `/courses/${courseId}/assessments${queryString ? `?${queryString}` : ''}`,
    token
  );

  const allAssessments = (response.data as any[]).map((a) => ({
    ...a,
    id: a._id,
  })) as Assessment[];

  const total = allAssessments.length;
  const PAGE_SIZE = 10; // Default to 10 items per page
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;

  return {
    assessments: allAssessments.slice(startIndex, endIndex),
    total,
    page,
  };
}


// 🔹 Get assessment by ID
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

// 🔹 Create assessment
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

// 🔹 Update assessment
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

// 🔹 Delete assessment
export async function deleteAssessment(
  courseId: number,
  id: string,
  token: string,
  userId: string
): Promise<void> {
  await deleteFromGateway(`/assessments/${id}?userId=${userId}`, token);
}

// 🔹 Submit assessment (student answers)
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

// 🔹 Get all submissions
export async function getSubmissionsForAssessment(
  assessmentId: string,
  token: string
): Promise<Submission[]> {
  const response = await getFromGateway(`/assessments/${assessmentId}/submissions`, token);
  return response.data as Submission[];
}

// 🔹 Get user submission for assessment
export async function getUserSubmissionForAssessment(
  assessmentId: string,
  userId: string,
  token: string
): Promise<Submission> {
  const response = await getFromGateway(`/assessments/${assessmentId}/submissions/${userId}`, token);
  return response.data as Submission;
}

// 🔹 Manual correction by teacher
export interface Correction {
  teacherId: string;
  corrections: string[];
  feedback: string;
  note: number;
  aiSummary?: string;
}

export async function submitCorrection(
  assessmentId: string,
  userId: string,
  correction: Omit<Correction, 'aiSummary'>,
  token: string
): Promise<Correction> {
  const response = await postToGateway(
    `/assessments/${assessmentId}/submissions/${userId}/correction`,
    correction,
    token
  );
  return {
    ...correction,
    aiSummary: response.data?.AIFeedback ?? '',
  };
}

// 🔹 Get correction for a submission (mapped from Submission)
export async function getCorrection(
  assessmentId: string,
  userId: string,
  token: string
): Promise<Correction> {
  const submission = await getUserSubmissionForAssessment(assessmentId, userId, token);
  return {
    teacherId: '', // optional, since it is not returned
    corrections: submission.answers.map((a) => a.correction),
    feedback: submission.feedback ?? '',
    note: submission.note ?? 0,
    aiSummary: submission.AIFeedback ?? '',
  };
}
