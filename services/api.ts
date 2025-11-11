const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export type BooleanQuizQuestionPayload = {
  text: string;
  type: 'boolean';
  options?: string[];
  correctAnswer: boolean;
};

export type InputQuizQuestionPayload = {
  text: string;
  type: 'input';
  correctAnswer: string;
};

export type CheckboxQuizQuestionPayload = {
  text: string;
  type: 'checkbox';
  options: string[];
  correctAnswer: string[];
};

export type QuizQuestionPayload =
  | BooleanQuizQuestionPayload
  | InputQuizQuestionPayload
  | CheckboxQuizQuestionPayload;

export type CreateQuizPayload = {
  title: string;
  questions: QuizQuestionPayload[];
};

export async function getQuizzes() {
  const res = await fetch(`${API_URL}/quizzes`);
  if (!res.ok) throw new Error('Failed to fetch quizzes');
  return res.json();
}

export async function getQuiz(id: string | number) {
  const res = await fetch(`${API_URL}/quizzes/${id}`);
  if (!res.ok) throw new Error('Failed to fetch quiz');
  return res.json();
}

export async function createQuiz(data: CreateQuizPayload) {
  const res = await fetch(`${API_URL}/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Failed to create quiz');
  return res.json();
}

export async function deleteQuiz(id: number) {
  const res = await fetch(`${API_URL}/quizzes/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete quiz');
}
