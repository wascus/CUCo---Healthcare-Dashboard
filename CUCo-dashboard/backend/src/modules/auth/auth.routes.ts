import { FastifyPluginAsync } from "fastify";
import {
  loginHandler,
  logoutHandler,
  meHandler,
  registerHandler,
  updateProfileHandler,
  reauthHandler,
  changeEmailHandler,
  changePasswordHandler,
  deleteAccountHandler,
  getUserIdHandler
} from "./auth.controller";
import { requireAuth } from "../../middleware/requireAuth";

const authRoutes: FastifyPluginAsync = async (app) => {
  // public
  app.post("/register", registerHandler);
  app.post("/login", loginHandler);
  app.get("/me", meHandler);
  app.post("/logout", logoutHandler);

  // protected
  app.patch("/profile", { preHandler: requireAuth }, updateProfileHandler);
  app.post("/reauth", { preHandler: requireAuth }, reauthHandler);
  app.post("/change-email", { preHandler: requireAuth }, changeEmailHandler);
  app.post("/change-password", { preHandler: requireAuth }, changePasswordHandler);
  app.post("/delete-account", { preHandler: requireAuth }, deleteAccountHandler);
  app.post("/user-id", { preHandler: requireAuth }, getUserIdHandler);

};

export default authRoutes;
