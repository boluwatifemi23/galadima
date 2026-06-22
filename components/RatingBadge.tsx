import { getPerformanceRatingLabel } from "@/lib/calculator";
import type { PerformanceRating } from "@/lib/types";

const CLASS_MAP: Record<string, string> = {
  outstanding: "badge-outstanding",
  excellent: "badge-excellent",
  good: "badge-good",
  fair: "badge-fair",
  needs_improvement: "badge-needs-improvement",
};

export default function RatingBadge({ rating }: { rating: PerformanceRating }) {
  return <span className={`badge ${CLASS_MAP[rating] || "badge-neutral"}`}>{getPerformanceRatingLabel(rating)}</span>;
}