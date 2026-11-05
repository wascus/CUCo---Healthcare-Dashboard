import type { RouteObject } from "react-router-dom";
import RelationsLayout from "./index";
import { Navigate } from "react-router-dom";

export const relationsRoute: RouteObject = {
  path: "network",
  element: <RelationsLayout />,
  children: [
    { index: true, element: <Navigate to="graph" replace /> },
    { path: "graph", lazy: async () => ({ Component: (await import("./pages/Graph/Graph")).default }) },
    { path: "consent", lazy: async () => ({ Component: (await import("./pages/Consent/Consent")).default }) },
    { path: "insights", lazy: async () => ({ Component: (await import("./pages/Insights/Insights")).default }) },
    { path: "support-circle", lazy: async () => ({ Component: (await import("./pages/SupportCircle/SupportCircle")).default }) },
    { path: "wall-sharing", lazy: async () => ({ Component: (await import("./pages/WallSharing/WallSharing")).default }) },
    { path: "social-needs", lazy: async () => ({ Component: (await import("./pages/SocialNeeds/SocialNeeds")).default }) },
    { path: "social-needs-covered", lazy: async () => ({ Component: (await import("./pages/SocialNeedsCovered/SocialNeedsCovered")).default }) },
  ],
};
