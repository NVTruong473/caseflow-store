export const CHECKOUT_ATTEMPT_STORAGE_KEY =
  "caseflow-books.checkout-attempt.v1";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getOrCreateCheckoutAttemptId(storage: Storage) {
  try {
    const storedAttemptId = storage.getItem(CHECKOUT_ATTEMPT_STORAGE_KEY);

    if (storedAttemptId && uuidPattern.test(storedAttemptId)) {
      return storedAttemptId;
    }

    const attemptId = crypto.randomUUID();
    storage.setItem(CHECKOUT_ATTEMPT_STORAGE_KEY, attemptId);
    return attemptId;
  } catch {
    return crypto.randomUUID();
  }
}

export function clearCheckoutAttemptId(
  storage: Storage,
  completedAttemptId: string,
) {
  try {
    if (storage.getItem(CHECKOUT_ATTEMPT_STORAGE_KEY) === completedAttemptId) {
      storage.removeItem(CHECKOUT_ATTEMPT_STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}
