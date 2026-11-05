
import { Type, Static } from '@sinclair/typebox';

export const TaskPriority = Type.Union([
  Type.Literal('LOW'),
  Type.Literal('MEDIUM'),
  Type.Literal('HIGH'),
]);

export type TaskPriorityType = Static<typeof TaskPriority>;

export const TaskTypeEnum = Type.Union([
  Type.Literal('SHORT_TERM'),
  Type.Literal('LONG_TERM'),
]);

export type TaskTypeEnumType = Static<typeof TaskTypeEnum>;

export const TaskSchema = Type.Object({
  id: Type.String(),
  userId: Type.String(),
  title: Type.String(),
  description: Type.Optional(Type.String()),
  priority: TaskPriority,
  taskType: TaskTypeEnum,
  scheduledDate: Type.Optional(Type.String({ format: 'date-time' })),
  scheduledTime: Type.Optional(Type.String()),
  completed: Type.Boolean(),
  createdAt: Type.String({ format: 'date-time' }),
  completedAt: Type.Optional(Type.String({ format: 'date-time' })),
});

export type TaskType = Static<typeof TaskSchema>;

export const CreateTaskBodySchema = Type.Object({
  title: Type.String({ minLength: 1 }),
  description: Type.Optional(Type.String()),
  priority: Type.Optional(TaskPriority),
  taskType: Type.Optional(TaskTypeEnum),
  scheduledDate: Type.Optional(Type.String({ format: 'date-time' })),
  scheduledTime: Type.Optional(Type.String()),
});

export type CreateTaskBodyType = Static<typeof CreateTaskBodySchema>;

export const UpdateTaskBodySchema = Type.Partial(Type.Object({
  title: Type.String({ minLength: 1 }),
  description: Type.Optional(Type.String()),
  priority: TaskPriority,
  taskType: TaskTypeEnum,
  scheduledDate: Type.Optional(Type.String({ format: 'date-time' })),
  scheduledTime: Type.Optional(Type.String()),
  completed: Type.Boolean(),
}));

export type UpdateTaskBodyType = Static<typeof UpdateTaskBodySchema>;

export const TaskListResponseSchema = Type.Array(TaskSchema);
export type TaskListResponseType = Static<typeof TaskListResponseSchema>;
