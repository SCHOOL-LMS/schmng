export const POSITIONS = ["Teacher", "Administrator", "Support Staff", "Manager"];

export const REVIEW_PERIODS = ["monthly", "quarterly", "annual"];

export const RATINGS = [
  { value: "excellent", label: "Excellent (5)", score: 5 },
  { value: "good", label: "Good (4)", score: 4 },
  { value: "satisfactory", label: "Satisfactory (3)", score: 3 },
  { value: "needs-improvement", label: "Needs Improvement (2)", score: 2 },
  { value: "unsatisfactory", label: "Unsatisfactory (1)", score: 1 },
] as const;

export const SCHEDULE_TYPES = ["regular", "overtime", "meeting", "training"];

export const OFFER_STATUSES = ["pending", "approved", "rejected"];

export function ratingScore(value: string) {
  return RATINGS.find((r) => r.value === value)?.score ?? 3;
}

export const currency = (n: number) =>
  `GHS ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
