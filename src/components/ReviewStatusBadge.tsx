import type { ReviewStatus } from "../../generated/prisma";

const styles: Record<ReviewStatus, string> = {
  PENDING: "bg-slate-100 text-slate-700",
  INCLUDE: "bg-emerald-100 text-emerald-800",
  EXCLUDE: "bg-red-100 text-red-800",
  MAYBE: "bg-amber-100 text-amber-800",
};

const labels: Record<ReviewStatus, string> = {
  PENDING: "Pending",
  INCLUDE: "Include",
  EXCLUDE: "Exclude",
  MAYBE: "Maybe",
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
