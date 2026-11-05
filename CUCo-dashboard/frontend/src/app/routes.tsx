import { createBrowserRouter, Outlet } from "react-router-dom";
import QueryRoot from "./query";
import RootLayout from "./RootLayout";

import Home from "./Home/Home";
import NotFound from "./NotFound/NotFound";
import AnimationsDebug from "./Debug/AnimationsDebug";

import Login from "../features/auth/Login/Login";
import Register from "../features/auth/Register/Register";

import { gamificationRoute } from "../features/gamification/routes";
import { relationsRoute } from "../features/relations/routes";

import { RequireAuth } from "./secure/RequireAuth";
import ManageAccount from "./ManageAccount/ManageAccount";
// Wrapper that gates its children behind auth
function ProtectedOutlet() {
  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  );
}

export const router = createBrowserRouter([
  {
    element: <QueryRoot />,
    children: [
      {
        element: <RootLayout />,
        children: [
          // Public routes
          { index: true, element: <Home /> },                 // "/"
          { path: "login", element: <Login /> },              // "/login"
          { path: "register", element: <Register /> },        // "/register"
          { path: "debug/animations", element: <AnimationsDebug /> }, // "/debug/animations"

          // Everything below requires auth
          {
            element: <ProtectedOutlet />,
            children: [
              {path: "/manage-account", element:<ManageAccount/> },
              { path: "individual/*", ...gamificationRoute }, // "/individual/*"
              { path: "network/*", ...relationsRoute },       // "/network/*"
            ],
          },

          // 404
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
]);


