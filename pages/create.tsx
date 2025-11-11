import { useState } from 'react';
import { useRouter } from 'next/router';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createQuiz } from '../services/api';

const questionTypes = ['boolean', 'input', 'checkbox'] as const;
type QuestionType = (typeof questionTypes)[number];

const questionSchema = z
  .object({
    text: z.string().min(1, 'Question text is required'),
    type: z.enum(questionTypes),
    options: z
      .array(z.string().trim().min(1, 'Option cannot be empty'))
      .optional(),
    correctBoolean: z.enum(['true', 'false']).optional(),
    correctInput: z.string().optional(),
    correctCheckbox: z.array(z.boolean()).optional(),
  })
  .superRefine((question, ctx) => {
    if (question.type === 'boolean') {
      if (!question.correctBoolean) {
        ctx.addIssue({
          path: ['correctBoolean'],
          code: z.ZodIssueCode.custom,
          message: 'Select the correct answer',
        });
      }
    }

    if (question.type === 'input') {
      if (!question.correctInput || question.correctInput.trim().length === 0) {
        ctx.addIssue({
          path: ['correctInput'],
          code: z.ZodIssueCode.custom,
          message: 'Provide the expected answer',
        });
      }
    }

    if (question.type === 'checkbox') {
      if (!question.options || question.options.length === 0) {
        ctx.addIssue({
          path: ['options'],
          code: z.ZodIssueCode.custom,
          message: 'Add at least one option for checkbox questions',
        });
      }

      if (
        !question.correctCheckbox ||
        question.correctCheckbox.length !== (question.options?.length ?? 0)
      ) {
        ctx.addIssue({
          path: ['correctCheckbox'],
          code: z.ZodIssueCode.custom,
          message: 'Mark which options are correct',
        });
      } else if (!question.correctCheckbox.some(Boolean)) {
        ctx.addIssue({
          path: ['correctCheckbox'],
          code: z.ZodIssueCode.custom,
          message: 'Select at least one correct option',
        });
      }
    }
  });

const createQuizSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  questions: z
    .array(questionSchema)
    .min(1, 'Add at least one question to the quiz'),
});

type CreateQuizForm = z.infer<typeof createQuizSchema>;

const defaultQuestion: CreateQuizForm['questions'][number] = {
  text: '',
  type: 'input',
  correctInput: '',
};

export default function CreateQuizPage() {
  const router = useRouter();
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateQuizForm>({
    resolver: zodResolver(createQuizSchema),
    defaultValues: {
      title: '',
      questions: [defaultQuestion],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions',
  });

  const questions = useWatch({
    control,
    name: 'questions',
  });

  const addQuestion = () => {
    append({ ...defaultQuestion });
  };

  const addOption = (questionIndex: number) => {
    const currentOptions = questions?.[questionIndex]?.options ?? [];
    const currentCorrect =
      questions?.[questionIndex]?.correctCheckbox ?? [];

    setValue(
      `questions.${questionIndex}.options`,
      [...currentOptions, ''],
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
    setValue(
      `questions.${questionIndex}.correctCheckbox`,
      [...currentCorrect, false],
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const currentOptions = questions?.[questionIndex]?.options ?? [];
    const currentCorrect =
      questions?.[questionIndex]?.correctCheckbox ?? [];

    const nextOptions = currentOptions.filter((_, idx) => idx !== optionIndex);
    const nextCorrect = currentCorrect.filter((_, idx) => idx !== optionIndex);

    setValue(
      `questions.${questionIndex}.options`,
      nextOptions.length ? nextOptions : undefined,
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
    setValue(
      `questions.${questionIndex}.correctCheckbox`,
      nextCorrect.length ? nextCorrect : undefined,
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  };

  const handleTypeChange = (questionIndex: number, newType: QuestionType) => {
    if (newType === 'boolean') {
      setValue(
        `questions.${questionIndex}.options`,
        undefined,
        { shouldDirty: true, shouldValidate: true }
      );
      setValue(
        `questions.${questionIndex}.correctCheckbox`,
        undefined,
        { shouldDirty: true, shouldValidate: true }
      );
      setValue(
        `questions.${questionIndex}.correctInput`,
        undefined,
        { shouldDirty: true, shouldValidate: true }
      );
      setValue(
        `questions.${questionIndex}.correctBoolean`,
        'true',
        { shouldDirty: true, shouldValidate: true }
      );
    } else if (newType === 'input') {
      setValue(
        `questions.${questionIndex}.options`,
        undefined,
        { shouldDirty: true, shouldValidate: true }
      );
      setValue(
        `questions.${questionIndex}.correctCheckbox`,
        undefined,
        { shouldDirty: true, shouldValidate: true }
      );
      setValue(
        `questions.${questionIndex}.correctBoolean`,
        undefined,
        { shouldDirty: true, shouldValidate: true }
      );
      setValue(
        `questions.${questionIndex}.correctInput`,
        '',
        { shouldDirty: true, shouldValidate: true }
      );
    } else if (newType === 'checkbox') {
      const existingOptions = questions?.[questionIndex]?.options ?? [];
      const existingCorrect =
        questions?.[questionIndex]?.correctCheckbox ?? [];
      const options =
        existingOptions.length > 0 ? existingOptions : [''];
      const correctFlags = options.map(
        (_, idx) => existingCorrect[idx] ?? false
      );

      setValue(
        `questions.${questionIndex}.options`,
        options,
        { shouldDirty: true, shouldValidate: true }
      );
      setValue(
        `questions.${questionIndex}.correctCheckbox`,
        correctFlags,
        { shouldDirty: true, shouldValidate: true }
      );
      setValue(
        `questions.${questionIndex}.correctBoolean`,
        undefined,
        { shouldDirty: true, shouldValidate: true }
      );
      setValue(
        `questions.${questionIndex}.correctInput`,
        undefined,
        { shouldDirty: true, shouldValidate: true }
      );
    }
  };

  const onSubmit = async (data: CreateQuizForm) => {
    setSubmissionError(null);
    try {
      const questionsPayload = data.questions.map((question) => {
        if (question.type === 'boolean') {
          return {
            text: question.text,
            type: question.type,
            options: ['True', 'False'],
            correctAnswer: question.correctBoolean === 'true',
          };
        }

        if (question.type === 'input') {
          return {
            text: question.text,
            type: question.type,
            correctAnswer: question.correctInput?.trim() ?? '',
          };
        }

        const options = (question.options ?? []).map((option) =>
          option.trim()
        );
        const correctCheckbox = question.correctCheckbox ?? [];
        const correctAnswer = options.filter(
          (_, idx) => correctCheckbox[idx]
        );

        return {
          text: question.text,
          type: question.type,
          options,
          correctAnswer,
        };
      });

      await createQuiz({
        title: data.title,
        questions: questionsPayload,
      });
      router.push('/quizzes');
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : 'Failed to create quiz'
      );
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
          Create a new quiz
        </h1>
        <button
          type="button"
          onClick={() => router.push('/quizzes')}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Back to list
        </button>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-8"
        noValidate
      >
        <div className="space-y-2">
          <label
            htmlFor="title"
            className="font-medium text-gray-800 dark:text-gray-200"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            placeholder="Quiz title"
            {...register('title')}
            className={`w-full rounded-md border px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-2 ${
              errors.title
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/60'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/60 dark:border-gray-700'
            }`}
          />
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Questions
            </h2>
            <button
              type="button"
              onClick={addQuestion}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Add question
            </button>
          </div>
          {errors.questions?.message && (
            <p className="text-sm text-red-600">{errors.questions.message}</p>
          )}

          <div className="space-y-6">
            {fields.map((field, questionIndex) => {
              const questionErrors = errors.questions?.[questionIndex];
              const questionType = questions?.[questionIndex]
                ?.type as QuestionType | undefined;

              return (
                <div
                  key={field.id}
                  className="space-y-4 rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <label
                        htmlFor={`question-${questionIndex}-text`}
                        className="font-medium text-gray-800 dark:text-gray-200"
                      >
                        Question text
                      </label>
                      <textarea
                        id={`question-${questionIndex}-text`}
                        placeholder="Enter question text"
                        {...register(`questions.${questionIndex}.text`)}
                        className={`min-h-[6rem] w-full rounded-md border px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-2 ${
                          questionErrors?.text
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/60'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/60 dark:border-gray-700'
                        }`}
                      />
                      {questionErrors?.text && (
                        <p className="text-sm text-red-600">
                          {questionErrors.text.message}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(questionIndex)}
                      disabled={fields.length === 1}
                      className="self-start rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="w-full space-y-2 md:max-w-xs">
                    <label
                      htmlFor={`question-${questionIndex}-type`}
                      className="font-medium text-gray-800 dark:text-gray-200"
                    >
                      Type
                    </label>
                    <select
                      id={`question-${questionIndex}-type`}
                      {...register(`questions.${questionIndex}.type`, {
                        onChange: (event) =>
                          handleTypeChange(
                            questionIndex,
                            event.target.value as QuestionType
                          ),
                      })}
                      className={`w-full rounded-md border px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-2 ${
                        questionErrors?.type
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/60'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/60 dark:border-gray-700'
                      }`}
                    >
                      <option value="">Select type</option>
                      {questionTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {questionErrors?.type && (
                      <p className="text-sm text-red-600">
                        {questionErrors.type.message}
                      </p>
                    )}
                  </div>

                  {questionType === 'boolean' && (
                    <div className="space-y-2 rounded-md border border-gray-200 p-4 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        Correct answer
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                          <input
                            type="radio"
                            value="true"
                            {...register(
                              `questions.${questionIndex}.correctBoolean`
                            )}
                            className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          True
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                          <input
                            type="radio"
                            value="false"
                            {...register(
                              `questions.${questionIndex}.correctBoolean`
                            )}
                            className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          False
                        </label>
                      </div>
                      {questionErrors?.correctBoolean && (
                        <p className="text-sm text-red-600">
                          {questionErrors.correctBoolean.message}
                        </p>
                      )}
                    </div>
                  )}

                  {questionType === 'input' && (
                    <div className="space-y-2">
                      <label
                        htmlFor={`question-${questionIndex}-correct-input`}
                        className="font-medium text-gray-800 dark:text-gray-200"
                      >
                        Expected answer
                      </label>
                      <input
                        id={`question-${questionIndex}-correct-input`}
                        type="text"
                        placeholder="Enter the expected answer"
                        {...register(`questions.${questionIndex}.correctInput`)}
                        className={`w-full rounded-md border px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-2 ${
                          questionErrors?.correctInput
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/60'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/60 dark:border-gray-700'
                        }`}
                      />
                      {questionErrors?.correctInput && (
                        <p className="text-sm text-red-600">
                          {questionErrors.correctInput.message}
                        </p>
                      )}
                    </div>
                  )}

                  {questionType === 'checkbox' && (
                    <div className="space-y-3 rounded-md border border-gray-200 p-4 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                          Options
                        </h3>
                        <button
                          type="button"
                          onClick={() => addOption(questionIndex)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          Add option
                        </button>
                      </div>

                      {!Array.isArray(questionErrors?.options) &&
                        questionErrors?.options && (
                          <p className="text-sm text-red-600">
                            {questionErrors.options.message}
                          </p>
                        )}

                      {!Array.isArray(questionErrors?.correctCheckbox) &&
                        questionErrors?.correctCheckbox && (
                          <p className="text-sm text-red-600">
                            {questionErrors.correctCheckbox.message}
                          </p>
                        )}

                      <div className="space-y-3">
                        {(questions?.[questionIndex]?.options ?? []).map(
                          (_, optionIndex) => {
                            const optionError = Array.isArray(
                              questionErrors?.options
                            )
                              ? questionErrors.options[optionIndex]
                              : undefined;

                            return (
                              <div
                                key={`${field.id}-option-${optionIndex}`}
                                className="flex flex-col gap-3 rounded-md border border-gray-200 p-3 sm:flex-row sm:items-start sm:justify-between dark:border-gray-700"
                              >
                                <div className="flex-1 space-y-2">
                                  <label
                                    htmlFor={`question-${questionIndex}-option-${optionIndex}`}
                                    className="text-sm font-medium text-gray-700 dark:text-gray-200"
                                  >
                                    Option {optionIndex + 1}
                                  </label>
                                  <input
                                    id={`question-${questionIndex}-option-${optionIndex}`}
                                    type="text"
                                    placeholder={`Option ${optionIndex + 1}`}
                                    {...register(
                                      `questions.${questionIndex}.options.${optionIndex}`
                                    )}
                                    className={`w-full rounded-md border px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-2 ${
                                      optionError
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/60'
                                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/60 dark:border-gray-700'
                                    }`}
                                  />
                                  {optionError && (
                                    <p className="text-sm text-red-600">
                                      {optionError.message}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-3">
                                  <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                    <input
                                      type="checkbox"
                                      {...register(
                                        `questions.${questionIndex}.correctCheckbox.${optionIndex}`
                                      )}
                                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    Correct answer
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeOption(questionIndex, optionIndex)
                                    }
                                    className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            );
                          }
                        )}

                        {((questions?.[questionIndex]?.options ?? []).length ===
                          0) && (
                          <p className="text-sm text-gray-500">
                            Add at least one option for checkbox questions.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {submissionError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
            {submissionError}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Submitting…' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/quizzes')}
            className="rounded-md border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
