export const CATEGORIES = [
  { value: "productivity", label: "Productivity" },
  { value: "revenue", label: "Revenue" },
  { value: "operational", label: "Operational" },
  { value: "quality", label: "Quality" },
  { value: "innovation", label: "Innovation" },
];

export const FORMULAS = [
  { value: "standard", label: "Standard (Actual ÷ Target × 100)" },
  { value: "reverse", label: "Reverse (lower is better, capped at 100%)" },
  { value: "binary", label: "Binary (Done = 100%, Not done = 0%)" },
  { value: "weighted", label: "Weighted" },
  { value: "growth", label: "Growth (capped at 150%)" },
];

export const KPI_TYPES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];

export const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];