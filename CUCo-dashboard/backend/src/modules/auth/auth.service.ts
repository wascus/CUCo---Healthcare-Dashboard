import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function findUserByEmailOrUsername(email: string, username: string) {
  return prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
}

export async function createUser(email: string, username: string, password: string, name?: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, username, passwordHash, name: name ?? null },
  });

  await prisma.inventoryItem.create({
    data: {
      userId: user.id,
      itemId: "item_33",
      quantity: 1,
    },
  });

  return user;
}

export async function verifyUserCredentials(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export async function updateUserName(id: string, name: string) {
  return prisma.user.update({ where: { id }, data: { name } });
}

export async function updateUserEmailWithPassword(id: string, newEmail: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("User not found");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error("Invalid password");

  const exists = await prisma.user.findUnique({ where: { email: newEmail } });
  if (exists && exists.id !== id) throw new Error("Email already in use");

  return prisma.user.update({ where: { id }, data: { email: newEmail } });
}

export async function updateUserPassword(id: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("User not found");

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw new Error("Invalid password");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  return prisma.user.update({ where: { id }, data: { passwordHash } });
}

export async function reauthCheck(id: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("User not found");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error("Invalid password");
  return true;
}

export async function deleteUserWithPassword(id: string, password: string) {
  await reauthCheck(id, password);
  // NOTE: ensure your Prisma schema handles cascades on delete as needed
  await prisma.user.delete({ where: { id } });
}
