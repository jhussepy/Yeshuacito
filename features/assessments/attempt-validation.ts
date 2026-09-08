export type SubmittedAnswer = {
  exerciseId: string;
  answer: string;
  responseMs: number;
  hintsUsed: number;
};

export type ExpectedExercise = {
  id: string;
  correctAnswer: string;
  difficulty: number;
};

export type VerifiedAnswer = SubmittedAnswer & { correct: boolean };

export type AttemptValidationResult =
  | { valid: false; message: string }
  | {
      valid: true;
      answers: VerifiedAnswer[];
      correct: number;
      total: number;
      difficulty: number;
      hints: number;
    };

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function validateCompletedAttempt(
  exercises: ExpectedExercise[],
  submitted: SubmittedAnswer[],
): AttemptValidationResult {
  if (exercises.length === 0) return { valid: false, message: "La lección no contiene ejercicios." };

  const answers: VerifiedAnswer[] = [];
  let expectedIndex = 0;

  for (const answer of submitted) {
    const expected = exercises[expectedIndex];
    if (!expected || answer.exerciseId !== expected.id) {
      return { valid: false, message: "Las respuestas no siguen la secuencia de la lección." };
    }

    const correct = normalize(answer.answer) === normalize(expected.correctAnswer);
    answers.push({ ...answer, correct });
    if (correct) expectedIndex += 1;
  }

  if (expectedIndex !== exercises.length) {
    return { valid: false, message: "Debes completar cada ejercicio exactamente una vez con éxito." };
  }

  return {
    valid: true,
    answers,
    correct: exercises.length,
    total: answers.length,
    difficulty: Math.max(...exercises.map((exercise) => exercise.difficulty)),
    hints: answers.reduce((total, answer) => total + answer.hintsUsed, 0),
  };
}
