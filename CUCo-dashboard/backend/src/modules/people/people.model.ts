export type Role = "individual" | "friend" | "doctor" | "acquaintance";

export interface Person {
  id: string;
  fullName: string;
  role: Role;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  tags?: string[];
}

export type RelationType = "friend" | "family" | "doctor" | "acquaintance";

export interface Edge {
  from: string; // person id
  to: string;   // person id
  type: RelationType;
  strength?: number; // 0..1
}
