export interface DateRange {
  start: Date;
  end: Date;
}

const DEFAULT_RANGE_DAYS = 30;

/** Resolves an optional `?from=&to=` query pair (ISO date strings) into a concrete range,
 * defaulting to the trailing 30 days. Invalid dates fall back to the default rather than
 * producing a NaN range. */
export function resolveDateRange(from?: string | null, to?: string | null): DateRange {
  const parsedTo = to ? new Date(to) : null;
  const end = parsedTo && !Number.isNaN(parsedTo.getTime()) ? parsedTo : new Date();

  const parsedFrom = from ? new Date(from) : null;
  const start =
    parsedFrom && !Number.isNaN(parsedFrom.getTime())
      ? parsedFrom
      : new Date(end.getTime() - DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);

  return { start, end };
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysAgo(days: number, from: Date = new Date()): Date {
  return new Date(from.getTime() - days * 24 * 60 * 60 * 1000);
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

export function startOfMonth(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}
