import { describe, expect, it } from "vitest";
import { validateCompletedAttempt } from "../../features/assessments/attempt-validation";

const exercises = [
  { id: "one", correctAnswer: "A", difficulty: 1 },
  { id: "two", correctAnswer: "B", difficulty: 4 },
];
const answer = (exerciseId: string, value: string) => ({
  exerciseId,
  answer: value,
  responseMs: 1_000,
  hintsUsed: 0,
});

describe("completed lesson validation", () => {
  it("accepts retries in lesson order and derives trusted metrics", () => {
    const result = validateCompletedAttempt(exercises, [
      answer("one", "wrong"),
      answer("one", "A"),
      answer("two", "B"),
    ]);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.correct).toBe(2);
      expect(result.total).toBe(3);
      expect(result.difficulty).toBe(4);
    }
  });

  it("rejects duplicated correct answers used for XP farming", () => {
    const repeated = Array.from({ length: 20 }, () => answer("one", "A"));
    expect(validateCompletedAttempt(exercises, repeated)).toEqual({
      valid: false,
      message: "Las respuestas no siguen la secuencia de la lección.",
    });
  });

  it("rejects missing and out-of-order exercises", () => {
    expect(validateCompletedAttempt(exercises, [answer("two", "B")]).valid).toBe(false);
    expect(validateCompletedAttempt(exercises, [answer("one", "A")]).valid).toBe(false);
  });
});
