import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISystemSettings extends Document {
  reportRecipientEmails: string[];
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  { reportRecipientEmails: { type: [String], default: [] } },
  { timestamps: { createdAt: false, updatedAt: true } }
);

const SystemSettings: Model<ISystemSettings> =
  mongoose.models.SystemSettings || mongoose.model<ISystemSettings>("SystemSettings", SystemSettingsSchema);

export default SystemSettings;

export async function getSystemSettings() {
  let settings = await SystemSettings.findOne();
  if (!settings) settings = await SystemSettings.create({ reportRecipientEmails: [] });
  return settings;
}