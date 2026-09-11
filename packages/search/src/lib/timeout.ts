export class StageTimeout extends Error {
  constructor(
    readonly stage: string,
    readonly ms: number,
  ) {
    super(`${stage} exceeded ${ms}ms`);
    this.name = "StageTimeout";
  }
}

export function withTimeout<T>(
  stage: string,
  ms: number,
  promise: Promise<T>,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new StageTimeout(stage, ms)), ms);
    if (typeof timer === "object" && "unref" in timer) timer.unref();
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export const isStageTimeout = (error: unknown): error is StageTimeout =>
  error instanceof StageTimeout;
