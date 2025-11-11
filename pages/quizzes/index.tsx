import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { deleteQuiz, getQuizzes } from '../../services/api';

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
  questions?: Question[];
};

type QuizzesListPageProps = {
  initialQuizzes: Quiz[];
};

export default function QuizzesListPage({
  initialQuizzes,
}: QuizzesListPageProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalQuizzes = useMemo(() => quizzes.length, [quizzes]);

  const handleDelete = useCallback(async (id: number) => {
    setError(null);
    setDeletingId(id);
    try {
      await deleteQuiz(id);
      setQuizzes((prev) => prev.filter((quiz) => quiz.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete quiz'
      );
    } finally {
      setDeletingId(null);
    }
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
            Quizzes
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {totalQuizzes === 0
              ? 'No quizzes available. Create one to get started.'
              : `${totalQuizzes} quiz${totalQuizzes === 1 ? '' : 'zes'} available.`}
          </p>
        </div>
        <Link
          href="/create"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Create quiz
        </Link>
      </header>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      <section className="space-y-4">
        {quizzes.map((quiz) => {
          const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
          return (
            <article
              key={quiz.id}
              className="flex flex-col gap-4 rounded-lg border border-gray-200 p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link
                  href={`/quizzes/${quiz.id}`}
                  className="text-xl font-semibold text-gray-900 transition hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
                >
                  {quiz.title}
                </Link>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {questions.length} question
                  {questions.length === 1 ? '' : 's'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(quiz.id)}
                disabled={deletingId === quiz.id}
                className="inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                aria-label="Delete quiz"
              >
                {deletingId === quiz.id ? (
                  <span className="px-2">Deleting…</span>
                ) : (
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.5 3a1.5 1.5 0 0 1 3 0H15a.75.75 0 0 1 0 1.5h-.557l-.7 9.262A2.25 2.25 0 0 1 11.5 16H8.5a2.25 2.25 0 0 1-2.243-2.238L5.557 4.5H5A.75.75 0 0 1 5 3h3.5Zm1.5 2.5a.75.75 0 0 0-1.5 0v7a.75.75 0 0 0 1.5 0v-7Zm2.75 0a.75.75 0 0 0-1.5 0v7a.75.75 0 0 0 1.5 0v-7Zm-7 0a.75.75 0 1 0-1.5 0l.7 9.262A3.75 3.75 0 0 0 8.5 17.5h3a3.75 3.75 0 0 0 3.743-3.738l.7-9.262a.75.75 0 0 0-1.494-.104L13.943 14.5A2.25 2.25 0 0 1 11.5 16h-3a2.25 2.25 0 0 1-2.243-2.238L5.8 5.396a.75.75 0 0 0-.75-.646Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </article>
          );
        })}

        {quizzes.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Start by creating your first quiz.
          </div>
        )}
      </section>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<
  QuizzesListPageProps
> = async () => {
  try {
    const quizzes = await getQuizzes();
    return { props: { initialQuizzes: quizzes } };
  } catch (error) {
    console.error('Failed to load quizzes', error);
    return { props: { initialQuizzes: [] } };
  }
};
