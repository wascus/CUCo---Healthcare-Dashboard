// modules/testsOverview/testsOverview.model.ts
export type EmotionName =
  | "Joy"
  | "Sadness"
  | "Anger"
  | "Fear"
  | "Hope"
  | "Love"
  | "Guilt"
  | "Acceptance"
  | "Confusion"
  | "Gratitude";

export interface EmotionEntryFE {
  id: string;
  emotion: EmotionName;
  color: string;
  intensity: number;
  note: string | null;
  createdAt: string; // ISO
}
