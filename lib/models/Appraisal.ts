import mongoose, { Schema, Document, Model } from "mongoose";
import type { PerformanceRating } from "@/lib/types";

export interface IAppraisal extends Document {
  employee: mongoose.Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  kpiScore: number;
  attendanceScore: number;
  complianceScore: number;
  managerReviewScore: number;
  peerReviewScore: number;
  totalScore: number;
  rating: PerformanceRating;
  managerNotes?: string;
  promotionRecommended: boolean;
  bonusRecommended: boolean;
  bonusNotes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AppraisalSchema = new Schema<IAppraisal>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    kpiScore: { type: Number, required: true, min: 0 },
    attendanceScore: { type: Number, default: 0, min: 0, max: 100 },
    complianceScore: { type: Number, default: 0, min: 0, max: 100 },
    managerReviewScore: { type: Number, default: 0, min: 0, max: 100 },
    peerReviewScore: { type: Number, default: 0, min: 0, max: 100 },
    totalScore: { type: Number, required: true },
    rating: { type: String, enum: ["outstanding", "excellent", "good", "fair", "needs_improvement"], required: true },
    managerNotes: { type: String, trim: true },
    promotionRecommended: { type: Boolean, default: false },
    bonusRecommended: { type: Boolean, default: false },
    bonusNotes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

AppraisalSchema.index({ employee: 1, periodStart: 1, periodEnd: 1 }, { unique: true });

const Appraisal: Model<IAppraisal> = mongoose.models.Appraisal || mongoose.model<IAppraisal>("Appraisal", AppraisalSchema);

export default Appraisal;