import { Static, Type } from "@sinclair/typebox";

// Literal union for Ajv/TypeBox friendliness
export const NoteKindLiteral = Type.Union([
  Type.Literal("POSITIVE"),
  Type.Literal("EMOTIONAL"),
]);
export type NoteKind = Static<typeof NoteKindLiteral>;

// Common error schemas
export const Unauthorized = Type.Object({ message: Type.String() });
export const NotFound = Type.Object({ message: Type.String() });
export const InternalError = Type.Object({ message: Type.String() });

export const DiaryItem = Type.Object({
  id: Type.String(),
  title: Type.String(), // <— NEW
  content: Type.String(),
  shared: Type.Boolean(),
  createdAt: Type.String({ format: "date-time" }),
  kind: NoteKindLiteral,
});
export type DiaryItemType = Static<typeof DiaryItem>;

export const CreateDiaryBody = Type.Object({
  title: Type.String({ minLength: 3 }),            // <— NEW
  content: Type.String({ minLength: 10 }),
  kind: NoteKindLiteral,
  shared: Type.Optional(Type.Boolean()),
});
export type CreateDiaryBodyType = Static<typeof CreateDiaryBody>;

export const ListDiaryQuery = Type.Object({
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  cursor: Type.Optional(Type.String()),
  kind: Type.Optional(NoteKindLiteral),
  shared: Type.Optional(Type.String({ pattern: "^(true|false)$" })),
});
export type ListDiaryQueryType = Static<typeof ListDiaryQuery>;

export const DeleteDiaryParams = Type.Object({
  id: Type.String(),
});
export type DeleteDiaryParamsType = Static<typeof DeleteDiaryParams>;

export const DiaryListResponse = Type.Object({
  items: Type.Array(DiaryItem),
  nextCursor: Type.Optional(Type.String()),
});
export type DiaryListResponseType = Static<typeof DiaryListResponse>;
