const LABELS: Record<string, string> = {
  Critical: "Critical",
  Urgent: "Urgent",
  High: "High",
  Medium: "Medium",
  Low: "Low",
  Informational: "Info",
};

export default function PriorityBadge({ priority }: { priority: string }) {
  return <span className={`badge badge-priority-${priority.toLowerCase()}`}>{LABELS[priority] || priority}</span>;
}