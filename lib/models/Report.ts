import mongoose, { Schema, Document, Model } from "mongoose";

export type ReportType = "weekly" | "monthly" | "quarterly" | "annual";

export interface IReport extends Document {
  reportType: ReportType;
  periodStart: Date;
  periodEnd: Date;
  generatedBy?: mongoose.Types.ObjectId; // omitted for automated reports
  recipientEmails: string[];
  pdfUrl?: string;
  sheetUrl?: string;
  emailSent: boolean;
  summary?: Record<string, unknown>;
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reportType: { type: String, enum: ["weekly", "monthly", "quarterly", "annual"], required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    recipientEmails: { type: [String], default: [] },
    pdfUrl: { type: String },
    sheetUrl: { type: String },
    emailSent: { type: Boolean, default: false },
    summary: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ReportSchema.index({ reportType: 1, createdAt: -1 });

const Report: Model<IReport> = mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema);

export default Report;