export type Placement = "base" | "middle" | "summit";
export type Status = "text" | "check" | "tear" | "image";

export interface Topic {
  id: string;
  title: string;
  placement: Placement;
  status: Status;
  createdAt: string; 
  updatedAt: string; 
}
