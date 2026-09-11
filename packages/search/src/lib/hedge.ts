const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function hedge<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  delayMs: number,
): Promise<T> {
  let succeeded = false;

  const first = primary().then((value) => {
    succeeded = true;
    return value;
  });

  const primaryFailed = first.then(
    () => new Promise<void>(() => {}),
    () => undefined,
  );

  const second = Promise.race([sleep(delayMs), primaryFailed]).then(() =>
    succeeded ? first : fallback(),
  );

  return Promise.any([first, second]).catch((error: unknown) => {
    if (error instanceof AggregateError) {
      throw error.errors[0] ?? new Error("both attempts failed");
    }
    throw error;
  });
}
