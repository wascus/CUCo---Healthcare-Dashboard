
import type { PrismaClient, TaskPriority as PrismaPriority } from "@prisma/client";
import type {
  CreateTaskBodyType,
  UpdateTaskBodyType,
  TaskType,
  TaskPriorityType,
  TaskTypeEnumType,
} from "./tasks.model";

export class TasksService {
  constructor(private prisma: PrismaClient) {}

  private toDto(task: any): TaskType {
    return {
      ...task,
      createdAt: task.createdAt.toISOString(),
      completedAt: task.completedAt?.toISOString(),
      priority: task.priority as TaskPriorityType,
      taskType: task.taskType as TaskTypeEnumType,
    };
  }

  async list(userId: string): Promise<TaskType[]> {
    const tasks = await this.prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return tasks.map((t) => this.toDto(t));
  }

  async create(userId: string, body: CreateTaskBodyType): Promise<TaskType> {
    const data: any = {
      userId,
      title: body.title,
      priority: (body.priority as PrismaPriority) || "MEDIUM",
      taskType: body.taskType || "LONG_TERM",
    };
    if (body.description != null) {
      data.description = body.description;
    }
    if (body.scheduledDate != null) {
      data.scheduledDate = new Date(body.scheduledDate);
    }
    if (body.scheduledTime != null) {
      data.scheduledTime = body.scheduledTime;
    }
    const task = await this.prisma.task.create({ data });
    return this.toDto(task);
  }

  async update(userId: string, id: string, body: UpdateTaskBodyType): Promise<TaskType | null> {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) return null;

    const completedAt = body.completed === true && !existing.completed
      ? new Date()
      : body.completed === false
        ? null
        : undefined;

    const data: any = {};
    if (body.title != null) {
      data.title = body.title;
    }
    if (body.description != null) {
      data.description = body.description;
    }
    if (body.priority != null) {
      data.priority = body.priority as PrismaPriority;
    }
    if (body.taskType != null) {
      data.taskType = body.taskType;
    }
    if (body.scheduledDate != null) {
      data.scheduledDate = new Date(body.scheduledDate);
    }
    if (body.scheduledTime != null) {
      data.scheduledTime = body.scheduledTime;
    }
    if (body.completed != null) {
      data.completed = body.completed;
    }
    if (completedAt !== undefined) {
      data.completedAt = completedAt;
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data,
    });
    return this.toDto(updated);
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) return false;

    await this.prisma.task.delete({ where: { id } });
    return true;
  }
}
