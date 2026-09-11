import { AppError, type SortDirection, type SortField } from "@repo/contracts";

export type Cursor = { id: string; sort: SortField; order: SortDirection };

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeCursor(
  raw: string,
  sort: SortField,
  order: SortDirection,
): Cursor {
  let parsed: unknown;

  try {
    parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    throw new AppError("VALIDATION_ERROR", "That page cursor is not valid");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Cursor).id !== "string" ||
    typeof (parsed as Cursor).sort !== "string" ||
    typeof (parsed as Cursor).order !== "string"
  ) {
    throw new AppError("VALIDATION_ERROR", "That page cursor is not valid");
  }

  const cursor = parsed as Cursor;

  if (cursor.sort !== sort || cursor.order !== order) {
    throw new AppError(
      "VALIDATION_ERROR",
      "That page cursor was issued for a different sort, start again from the first page",
    );
  }

  return cursor;
}
