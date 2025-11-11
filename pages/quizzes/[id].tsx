import Link from 'next/link';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getQuiz } from '../../services/api';

type Question = {
  id: number;
  text: string;
  type: 'boolean' | 'input' | 'checkbox';
  options?: string[];
  correctAnswer?: boolean | string | string[];
};

type Quiz = {
  id: number;
  title: string;
  questions: Question[];
};

type QuizDetailsPageProps = {
  quiz: Quiz | null;
};

export default function QuizDetailsPage({
  quiz,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const questions: Question[] = Array.isArray(quiz?.questions)
    ? (quiz?.questions as Question[])
    : [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/quizzes"
        className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
      >
        ← Back to list
      </Link>

      {quiz ? (
        <article className="mt-6 space-y-6">
          <header>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
              {quiz.title}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {questions.length} question
              {questions.length === 1 ? '' : 's'}
            </p>
          </header>

          <section className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={question.id ?? `${quiz.id}-${index}`}
                className="space-y-3 rounded-lg border border-gray-200 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Question {index + 1}
                  </h2>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold capitalize text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                    {question.type}
                  </span>
                </div>

                <p className="text-base text-gray-700 dark:text-gray-200">
                  {question.text}
                </p>

                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  {question.type === 'boolean' && (
                    <p>
                      Correct answer:{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {typeof question.correctAnswer === 'boolean'
                          ? question.correctAnswer
                            ? 'True'
                            : 'False'
                          : 'True / False'}
                      </span>
                    </p>
                  )}

                  {question.type === 'input' && (
                    <p>
                      Expected answer:{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {typeof question.correctAnswer === 'string' &&
                        question.correctAnswer.trim().length > 0
                          ? question.correctAnswer
                          : 'Text answer'}
                      </span>
                    </p>
                  )}

                  {question.type === 'checkbox' && (
                    <div className="space-y-2">
                      <span className="font-medium text-gray-600 dark:text-gray-300">
                        Options:
                      </span>
                      <ul className="space-y-1 pl-5">
                        {(question.options ?? []).map(
                          (option, optionIndex) => {
                            const correctAnswers = Array.isArray(
                              question.correctAnswer
                            )
                              ? question.correctAnswer
                              : [];
                            const isCorrect = correctAnswers.includes(option);

                            return (
                              <li
                                key={`${question.id ?? `${quiz.id}-${index}`}-option-${optionIndex}`}
                                className="flex items-start gap-2"
                              >
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                                <span
                                  className={`text-gray-700 dark:text-gray-200 ${
                                    isCorrect ? 'font-semibold text-green-600 dark:text-green-400' : ''
                                  }`}
                                >
                                  {option}
                                </span>
                                {isCorrect && (
                                  <span className="text-xs font-medium uppercase tracking-wide text-green-600 dark:text-green-400">
                                    Correct
                                  </span>
                                )}
                              </li>
                            );
                          }
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>
        </article>
      ) : (
        <div className="mt-8 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
          Quiz not found.
        </div>
      )}
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<
  QuizDetailsPageProps
> = async (context) => {
  const { id } = context.params ?? {};

  if (!id || Array.isArray(id)) {
    return { props: { quiz: null } };
  }

  try {
    const quiz = await getQuiz(id);
    return { props: { quiz } };
  } catch (error) {
    console.error(`Failed to load quiz ${id}`, error);
    return { props: { quiz: null } };
  }
};
