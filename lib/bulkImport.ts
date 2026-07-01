import { ROLE_LABELS } from "@/lib/constants";
import { DEPARTMENTS } from "@/lib/types";
import type { UserRole } from "@/lib/types";

export interface EmployeeImportRow {
  rowIndex: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  errors: string[];
}

const ROLE_LOOKUP: Record<string, UserRole> = {
  "super admin": "super_admin",
  super_admin: "super_admin",
  "department head": "department_head",
  department_head: "department_head",
  staff: "staff",
  "hr admin": "hr_admin",
  hr_admin: "hr_admin",
  "hr/admin": "hr_admin",
};

export function parseEmployeeRow(raw: Record<string, string | number | boolean | null | undefined>, rowIndex: number): EmployeeImportRow {
  const errors: string[] = [];

  const name = String(raw["Full Name"] || raw["Name"] || "").trim();
  const email = String(raw["Email"] || "").trim().toLowerCase();
  const phone = String(raw["Phone"] || "").trim();
  const roleRaw = String(raw["Role"] || "").trim().toLowerCase();
  const department = String(raw["Department"] || "").trim();

  if (!name) errors.push("Name is required");
  if (!email || !email.includes("@")) errors.push("Valid email is required");
  const role = ROLE_LOOKUP[roleRaw];
  if (!role) errors.push(`Role must be one of: ${Object.values(ROLE_LABELS).join(", ")}`);
  if (!department || !(DEPARTMENTS as readonly string[]).includes(department)) errors.push(`Department must be one of: ${DEPARTMENTS.join(", ")}`);

  return { rowIndex, name, email, phone, role: role || "", department, errors };
}

export interface KPIImportRow {
  rowIndex: number;
  employeeEmail: string;
  name: string;
  description: string;
  category: string;
  formula: string;
  kpiType: string;
  targetValue: number;
  weight: number;
  dueDate: string;
  evidenceRequired: boolean;
  errors: string[];
}

const CATEGORY_VALUES = ["productivity", "revenue", "operational", "quality", "innovation"];
export const FORMULA_VALUES = ["standard", "reverse", "binary", "weighted", "growth"];
export const KPI_TYPE_VALUES = ["weekly", "monthly", "quarterly", "annual"];

// Excel stores dates as serial numbers (days since Dec 30, 1899).
// When xlsx reads a date cell, it comes back as a number, not a string.
// "2026-07-01" in Excel = serial 46204. new Date("46204") = year 46204.
// This function handles all three cases: Excel serial, ISO string, or blank.
type ImportCellValue = string | number | boolean | Date | null | undefined;

function parseExcelDate(raw: ImportCellValue): string {
  if (raw === null || raw === undefined || raw === "") return "";

  // Excel serial number
  if (typeof raw === "number") {
    const date = new Date(Math.round((raw - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10);
    return "";
  }

  // JavaScript Date object (some xlsx parsers return these directly)
  if (raw instanceof Date) {
    if (!isNaN(raw.getTime())) return raw.toISOString().slice(0, 10);
    return "";
  }

  // Plain string
  const str = String(raw).trim();
  if (!str) return "";

  // If it looks like a number stored as text (e.g. "46204"), treat as serial
  if (/^\d{4,5}$/.test(str)) {
    const serial = parseInt(str, 10);
    if (serial > 40000 && serial < 60000) { // plausible Excel date range
      const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10);
    }
  }

  // ISO or other parseable string
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);

  return str; // return as-is and let the validator below catch it
}

// Accept common variations so "Reverse" or "REVERSE" never fail validation
function normalizeFormula(raw: string): string {
  const lower = raw.toLowerCase().trim();
  for (const val of FORMULA_VALUES) {
    if (lower === val || lower.startsWith(val)) return val;
  }
  const aliases: Record<string, string> = {
    "lower is better": "reverse",
    "yes/no": "binary",
    "done/not done": "binary",
    "normal": "standard",
  };
  return aliases[lower] || lower;
}

export function parseKPIRow(raw: Record<string, ImportCellValue>, rowIndex: number): KPIImportRow {
  const errors: string[] = [];

  const employeeEmail = String(raw["Employee Email"] || "").trim().toLowerCase();
  const name = String(raw["KPI Name"] || raw["Name"] || "").trim();
  const description = String(raw["Description"] || "").trim();
  const category = String(raw["Category"] || "").trim().toLowerCase();
  const formula = normalizeFormula(String(raw["Formula"] || "standard"));
  const kpiType = String(raw["KPI Type"] || "").trim().toLowerCase();
  const targetValue = Number(raw["Target Value"]);
  const weight = Number(raw["Weight"]);
  const dueDate = parseExcelDate(raw["Due Date"]);
  const evidenceRaw = String(raw["Evidence Required"] || "no").trim().toLowerCase();
  const evidenceRequired = ["yes", "true", "1"].includes(evidenceRaw);

  if (!employeeEmail || !employeeEmail.includes("@")) errors.push("Valid Employee Email is required");
  if (!name) errors.push("KPI Name is required");
  if (!CATEGORY_VALUES.includes(category)) errors.push(`Category must be one of: ${CATEGORY_VALUES.join(", ")}`);
  if (!FORMULA_VALUES.includes(formula)) errors.push(`Formula must be one of: ${FORMULA_VALUES.join(", ")}`);
  if (!KPI_TYPE_VALUES.includes(kpiType)) errors.push(`KPI Type must be one of: ${KPI_TYPE_VALUES.join(", ")}`);
  if (!targetValue || isNaN(targetValue) || targetValue <= 0) errors.push("Target Value must be a positive number");
  if (!weight || isNaN(weight) || weight <= 0 || weight > 100) errors.push("Weight must be a number between 1 and 100");
  if (dueDate && isNaN(new Date(dueDate).getTime())) errors.push(`Due Date "${dueDate}" is not a valid date — use YYYY-MM-DD format or leave it blank`);

  return { rowIndex, employeeEmail, name, description, category, formula, kpiType, targetValue, weight, dueDate, evidenceRequired, errors };
}
