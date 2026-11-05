import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "./theme";             
import { AuthProvider } from "./features/auth/AuthContext";
import { router } from "./app/routes";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<div>Loading…</div>}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </Suspense>
  </StrictMode>
);