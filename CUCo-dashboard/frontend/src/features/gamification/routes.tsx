import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import GamificationLayout from "./index";

export const gamificationRoute: RouteObject = {
  path: "individual",
  element: <GamificationLayout />,
  children: [
    { index: true, element: <Navigate to="diary" replace /> },
    { path: "diary", lazy: async () => ({ Component: (await import("./pages/DiaryWall/DiaryWall")).default }) },
    { path: "tests", lazy: async () => ({ Component: (await import("./pages/TestsOverview/TestsOverview")).default }) },
    { path: "grief-topics", lazy: async () => ({ Component: (await import("./pages/GriefTopics/GriefTopics")).default }) },
    { path: "exercises", lazy: async () => ({ Component: (await import("./pages/ExercisesWall/ExercisesWall")).default }) },
    { path: "exercise-preference", lazy: async () => ({ Component: (await import("./pages/ExercisePreference/ExercisePreference")).default }) },
    { path: "social-events", lazy: async () => ({ Component: (await import("./pages/SocialEventTracker/SocialEventTracker")).default }) },
    { path: "knowledge", lazy: async () => ({ Component: (await import("./pages/KnowledgeList/KnowledgeList")).default }) },
    { path: "activity", lazy: async () => ({ Component: (await import("./pages/ActivityOverview/ActivityOverview")).default }) },
    { path: "gamification", lazy: async () => ({ Component: (await import("./pages/Gamification/Gamification")).default }) },
  ],
};
