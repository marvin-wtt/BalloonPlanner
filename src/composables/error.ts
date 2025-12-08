import { useQuasar } from 'quasar';

export function useErrorHelper() {
  const quasar = useQuasar();

  function withErrorNotification<T>(fn: () => T) {
    try {
      return fn();
    } catch (error) {
      quasar.notify({
        type: 'negative',
        message: 'Error',
        caption: getErrorMessage(error),
      });
    }
  }

  return { withErrorNotification };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
