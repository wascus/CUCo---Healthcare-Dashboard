import type { PrismaClient, NoteKind as PrismaNoteKind } from "@prisma/client";
import type {
  CreateDiaryBodyType,
  ListDiaryQueryType,
  DiaryListResponseType,
  NoteKind, // "POSITIVE" | "EMOTIONAL"
} from "./diary.model";

export class DiaryService {
  constructor(private prisma: PrismaClient) {}

  private toDto(note: {
    id: string;
    title: string;
    content: string;
    shared: boolean;
    createdAt: Date;
    kind: PrismaNoteKind;
  }) {
    return {
      id: note.id,
      title: note.title,
      content: note.content,
      shared: note.shared,
      createdAt: note.createdAt.toISOString(),
      // Cast to the literal union that our API expects
      kind: note.kind as NoteKind,
    };
  }

  async list(userId: string, q: ListDiaryQueryType): Promise<DiaryListResponseType> {
    const limit = q.limit ?? 20;

    const where: any = { userId };
    if (q.kind) where.kind = q.kind;
    if (q.shared === "true") where.shared = true;
    if (q.shared === "false") where.shared = false;

    const rows = await this.prisma.diaryNote.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
      select: { id: true, title: true, content: true, shared: true, createdAt: true, kind: true },
    });

    const items = rows.map((n) => this.toDto(n));
    const last = rows.at(-1);
    const hasNext = rows.length === limit && !!last;

    const resp: DiaryListResponseType = {
      items,
      ...(hasNext ? { nextCursor: last!.id } : {}),
    };
    return resp;
  }

  async create(userId: string, body: CreateDiaryBodyType) {
    const created = await this.prisma.diaryNote.create({
      data: {
        userId,
        title: body.title.trim(),
        content: body.content.trim(),
        kind: body.kind as PrismaNoteKind,
        shared: body.shared ?? false,
      },
      select: { id: true, title: true, content: true, shared: true, createdAt: true, kind: true },
    });
    return this.toDto(created);
  }

  async deleteOwned(userId: string, id: string) {
    const note = await this.prisma.diaryNote.findUnique({ where: { id } });
    if (!note || note.userId !== userId) return null;
    await this.prisma.diaryNote.delete({ where: { id } });
    return { ok: true };
  }
}
