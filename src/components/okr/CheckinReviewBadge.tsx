import type { CheckinReview } from "@/types";

const statusConfig = {
  approved: { label: "Bestätigt", emoji: "✅", className: "badge-green" },
  noted: { label: "Notiert", emoji: "📝", className: "badge-gray" },
  rejected: { label: "Anpassung nötig", emoji: "⚠️", className: "badge-red" },
} as const;

interface CheckinReviewBadgeProps {
  review: CheckinReview;
  showComment?: boolean;
}

export function CheckinReviewBadge({ review, showComment = true }: CheckinReviewBadgeProps) {
  const config = statusConfig[review.status];

  return (
    <div className="mt-1.5">
      <span className={`badge ${config.className} text-[11px]`}>
        {config.emoji} {config.label}
        {review.reviewer_name && (
          <span className="text-[10px] ml-1 opacity-70">
            — {review.reviewer_name}
          </span>
        )}
      </span>
      {showComment && review.comment && review.status === "rejected" && (
        <p className="text-[12px] text-[var(--status-error)] mt-1 ml-1">
          {review.comment}
        </p>
      )}
    </div>
  );
}
