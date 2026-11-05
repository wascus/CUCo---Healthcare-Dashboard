import type { ConnectionView, RelationshipType, AccessLevel } from "../../../../services/connections";

export const GROUPS = [
{ key: "supporters", title: "supporters", icon: "EmojiEmotions" },
{ key: "acquaintances", title: "acquaintances", icon: "SentimentSatisfiedAlt" },
{ key: "professionals", title: "professionals", icon: "LocalHospital" },
] as const;
export type GroupKey = typeof GROUPS[number]["key"];
export const GROUP_TITLES = GROUPS.map(g => g.title);

export const REL_OPTS: RelationshipType[] = [
"BEST_FRIEND","GOOD_FRIEND","PARTNER","PARENT","CHILD","SIBLING",
"AUNT_UNCLE","COUSIN","THERAPIST","DOCTOR","OTHER",
];
export const ACCESS_OPTS: AccessLevel[] = ["NONE","POSITIVE_ONLY","NEGATIVE_ONLY","FULL","CUSTOM"];

export const PROFESSIONALS: RelationshipType[] = ["DOCTOR","THERAPIST"];
export const SUPPORTERS: RelationshipType[] = ["BEST_FRIEND","GOOD_FRIEND","PARTNER","PARENT","CHILD","SIBLING"];
export const ACQUAINTANCES: RelationshipType[] = ["AUNT_UNCLE","COUSIN","OTHER"];

export const isProfessional = (r: RelationshipType) => PROFESSIONALS.includes(r);

export function groupKeyForRelationship(r: RelationshipType): GroupKey {
if (isProfessional(r)) return "professionals";
if (SUPPORTERS.includes(r)) return "supporters";
return "acquaintances";
}
export function groupTitleForRelationship(r: RelationshipType): string {
const key = groupKeyForRelationship(r);
return GROUPS.find(g => g.key === key)!.title;
}

export function bucketOf(c: ConnectionView): GroupKey {
return groupKeyForRelationship(c.relationship);
}

export function prettyAccess(a: AccessLevel | string | undefined) {
return (a ?? "").toString().replace(/_/g, " ").toLowerCase();
}