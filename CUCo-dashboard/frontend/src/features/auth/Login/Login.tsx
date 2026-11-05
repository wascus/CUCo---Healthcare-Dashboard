import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import {
  Box, Button, TextField, Typography, Link, Paper,
  InputAdornment, IconButton, Alert
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { api as authApi } from "../../../services/api";
import { useAuth } from "../AuthContext";
import type { AuthUser } from "../../../types/auth";
import AuthLayout from "../AuthLayout";
import "../AuthPage.css";

type Form = { email: string; password: string };

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const { setUser } = useAuth();

  const onSubmit = handleSubmit(async (values) => {
    try {
      setServerError(null);

      const resp = await authApi.login(values) as
        | { token?: string; user?: AuthUser }
        | { ok?: true };

      if ("user" in resp && resp.user) {
        setUser(resp.user);
        try { localStorage.setItem("auth-sync", `login:${JSON.stringify(resp.user)}`); } catch {}
      } else {
        const me = await authApi.me();
        setUser((me as AuthUser) ?? null);
        if (me) { try { localStorage.setItem("auth-sync", `login:${JSON.stringify(me)}`); } catch {} }
      }

      const params = new URLSearchParams(loc.search);
      const next = params.get("next") || "/";
      nav(next, { replace: true });
    } catch (e: any) {
      setServerError(e?.message ?? "Sign-in failed");
    }
  });

  return (
    <AuthLayout title="Welcome back 👋" subtitle="Continue your journey toward better emotional well-being.">
      <Paper elevation={0} className="auth-card">
        <div className="auth-header">
          <Typography variant="h5" fontWeight={700}>Log in</Typography>
          <Typography className="auth-help" variant="body2">
            Enter your credentials to access your dashboard.
          </Typography>
        </div>

        {serverError && <Alert severity="error" sx={{ mb: 1 }}>{serverError}</Alert>}

        <Box component="form" onSubmit={onSubmit} className="auth-form" autoComplete="off">
          <TextField
            label="Email"
            type="email"
            autoComplete="off"
            variant="outlined"
            size="medium"
            error={!!errors.email}
            helperText={errors.email ? "Email is required" : ""}
            {...register("email", { required: true })}
          />

          <TextField
            label="Password"
            type={showPwd ? "text" : "password"}
            autoComplete="off"
            variant="outlined"
            size="medium"
            error={!!errors.password}
            helperText={errors.password ? "Password is required" : ""}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    onClick={() => setShowPwd(v => !v)}
                    onMouseDown={(e) => e.preventDefault()}
                    aria-label="toggle password visibility"
                  >
                    {showPwd ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            {...register("password", { required: true })}
          />

          <div className="auth-actions">
            <Button type="submit" variant="contained" disabled={isSubmitting} className="auth-submit">
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
            <Typography className="auth-small">
              Don’t have an account?{" "}
              <Link component={RouterLink} to="/register">Create one</Link>
            </Typography>
          </div>
        </Box>
      </Paper>
    </AuthLayout>
  );
}
