export type Placement = "base" | "middle" | "summit";
export type Status = "text" | "check" | "tear" | "image";

export interface Topic {
  id: string;
  topicId?: string | null;
  title: string;
  isCustom?: boolean;
  placement: Placement;
  status: Status;
  createdAt?: string;
  updatedAt?: string;
  shared?: boolean;
  description?: string | null; 
}