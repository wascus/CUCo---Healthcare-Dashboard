import { FastifyReply, FastifyRequest } from "fastify";
import * as jwt from "jsonwebtoken";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  reauthSchema,
  changeEmailSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from "./auth.schemas";
import {
  createUser,
  findUserByEmailOrUsername,
  findUserById,
  verifyUserCredentials,
  updateUserName,
  updateUserEmailWithPassword,
  updateUserPassword,
  reauthCheck,
  deleteUserWithPassword,
} from "./auth.service";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const COOKIE_NAME = "token";
const isProd = process.env.NODE_ENV === "production";

function setSessionCookie(reply: FastifyReply, userId: string) {
  const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "14d" });
  reply.setCookie(COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function registerHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = registerSchema.parse(req.body);
  const existing = await findUserByEmailOrUsername(body.email, body.username);
  if (existing) return reply.status(409).send({ message: "User already exists" });

  const user = await createUser(body.email, body.username, body.password, body.name);
  setSessionCookie(reply, user.id);
  return reply.send({ id: user.id, email: user.email, username: user.username, name: user.name });
}

export async function loginHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = loginSchema.parse(req.body);
  const user = await verifyUserCredentials(body.email, body.password);
  if (!user) return reply.status(401).send({ message: "Invalid credentials" });

  setSessionCookie(reply, user.id);
  return reply.send({ id: user.id, email: user.email, username: user.username, name: user.name });
}

export async function logoutHandler(req: FastifyRequest, reply: FastifyReply) {
  reply.clearCookie(COOKIE_NAME, { path: "/" });
  return reply.status(204).send();
}

export async function meHandler(req: FastifyRequest, reply: FastifyReply) {
  const token = (req as any).cookies?.[COOKIE_NAME];
  if (!token) return reply.send(null);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    const user = await findUserById(payload.sub);
    if (!user) return reply.send(null);
    return reply.send({ id: user.id, email: user.email, username: user.username, name: user.name });
  } catch {
    return reply.send(null);
  }
}

export async function updateProfileHandler(req: FastifyRequest, reply: FastifyReply) {
  const { name } = updateProfileSchema.parse(req.body);
  const userId = (req as any).userId as string;
  const u = await updateUserName(userId, name);
  return reply.send({ id: u.id, email: u.email, username: u.username, name: u.name });
}

export async function reauthHandler(req: FastifyRequest, reply: FastifyReply) {
  const { password } = reauthSchema.parse(req.body);
  const userId = (req as any).userId as string;
  try {
    await reauthCheck(userId, password);
    return reply.status(204).send();
  } catch {
    return reply.status(401).send({ message: "Invalid password" });
  }
}

export async function changeEmailHandler(req: FastifyRequest, reply: FastifyReply) {
  const { newEmail, password } = changeEmailSchema.parse(req.body);
  const userId = (req as any).userId as string;
  try {
    const u = await updateUserEmailWithPassword(userId, newEmail, password);
    return reply.send({ id: u.id, email: u.email, username: u.username, name: u.name });
  } catch (e: any) {
    const msg = e?.message || "Failed to change email";
    const status = msg === "Invalid password" ? 401 : 400;
    return reply.status(status).send({ message: msg });
  }
}

export async function changePasswordHandler(req: FastifyRequest, reply: FastifyReply) {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const userId = (req as any).userId as string;
  try {
    await updateUserPassword(userId, currentPassword, newPassword);
    return reply.status(204).send();
  } catch (e: any) {
    const msg = e?.message || "Failed to change password";
    const status = msg === "Invalid password" ? 401 : 400;
    return reply.status(status).send({ message: msg });
  }
}

export async function deleteAccountHandler(req: FastifyRequest, reply: FastifyReply) {
  const { password } = deleteAccountSchema.parse(req.body);
  const userId = (req as any).userId as string;
  try {
    await deleteUserWithPassword(userId, password);
    reply.clearCookie(COOKIE_NAME, { path: "/" });
    return reply.status(204).send();
  } catch (e: any) {
    const msg = e?.message || "Failed to delete account";
    const status = msg === "Invalid password" ? 401 : 400;
    return reply.status(status).send({ message: msg });
  }
}

export async function getUserIdHandler(req: FastifyRequest, reply: FastifyReply) {
  // Require password in body (just like /reauth)
  const { password } = reauthSchema.parse(req.body);
  const userId = (req as any).userId as string;

  try {
    await reauthCheck(userId, password);
    // Only now send the sensitive ID back
    return reply.send({ userId });
  } catch {
    return reply.status(401).send({ message: "Invalid password" });
  }
}