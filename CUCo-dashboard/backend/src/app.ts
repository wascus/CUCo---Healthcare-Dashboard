import Fastify from "fastify";

// Plugins
import corsPlugin from "./plugins/cors";
import jwtPlugin from "./plugins/jwt";
import prismaPlugin from "./plugins/prisma";

// Routes
import griefRoutes from "./modules/grief/grief.routes";
import peopleRoutes from "./modules/people/people.routes";
import authRoutes from "./modules/auth/auth.routes";
import catalogRoutes from "./modules/catalog/catalog.routes";
import connectionsRoutes from "./modules/connections/connections.routes";
import notificationsRoutes from "./modules/notifications/notifications.routes";
import viewersRoutes from "./modules/viewers/viewers.routes";
import groupsRoutes from "./modules/groups/groups.routes";
import diaryRoutes from "./modules/diary/diary.routes";
import testsOverviewRoutes from "./modules/testsOverview/testsOverview.routes";
import shopRoutes from "./modules/shop/shop.routes";
import inventoryRoutes from "./modules/inventory/inventory.routes";
import tasksRoutes from "./modules/tasks/tasks.routes";
import streakRoutes from "./modules/gamification/streak.routes";
import milestoneRoutes from "./modules/gamification/milestone.routes";

export function buildApp() {
  const app = Fastify({ logger: true });

  // 1) CORS first (so preflights succeed)
  app.register(corsPlugin);

  // 2) JWT (also registers @fastify/cookie inside)
  app.register(jwtPlugin);

  // 3) Prisma
  app.register(prismaPlugin);

  // 4) Routes (now they can use fastify.authenticate)
  app.register(griefRoutes, { prefix: "/api/v1/grief" });
  app.register(peopleRoutes, { prefix: "/api/v1/people" });
  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(catalogRoutes, { prefix: "/api/v1/catalog" });
  app.register(connectionsRoutes, { prefix: "/api/v1/connections" });
  app.register(diaryRoutes, { prefix: "/api/v1/diary-notes" });
  app.register(notificationsRoutes, { prefix: "/api/v1/notifications" });
  app.register(viewersRoutes, { prefix: "/api/v1/viewers" });
  app.register(groupsRoutes, { prefix: "/api/v1/groups" });
  app.register(testsOverviewRoutes, { prefix: "/api/v1/tests-overview" });
  app.register(shopRoutes, { prefix: "/api/v1/shop" });
  app.register(inventoryRoutes, { prefix: "/api/v1/inventory" });
  app.register(tasksRoutes, { prefix: "/api/v1/tasks" });
  app.register(streakRoutes, { prefix: "/api/v1/gamification/streak" });
  app.register(milestoneRoutes, { prefix: "/api/v1/milestones" });

  // Healthcheck
  app.get("/health", async () => ({ ok: true }));

  // Print routes after ready (nice for debugging)
  app.ready().then(() => {
    console.log(app.printRoutes());
  });

  return app;
}

