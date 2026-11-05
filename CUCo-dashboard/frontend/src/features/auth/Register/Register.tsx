import { useState,useMemo } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link as RouterLink, useLocation } from "react-router-dom";
import {
  Box, Button, TextField, Typography, Link, Paper,
  InputAdornment, IconButton, Alert,  Tooltip,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { api as authApi } from "../../../services/api";
import { useAuth } from "../AuthContext";
import type { AuthUser } from "../../../types/auth";
import AuthLayout from "../AuthLayout";
import "../AuthPage.css";
import "./Register.css";
type Form = { name?: string; email: string; username: string; password: string };

function pwdStrength(pw: string) {
  const len = pw.length >= 8;
  const lower = /[a-z]/.test(pw);
  const upper = /[A-Z]/.test(pw);
  const digit = /\d/.test(pw);
  const special = /[^A-Za-z0-9]/.test(pw);
  const score = [len, lower, upper, digit, special].filter(Boolean).length;
  return { len, lower, upper, digit, special, score };
}
function strengthLabel(score: number) {
  if (score <= 2) return "Weak";
  if (score === 3) return "Fair";
  if (score === 4) return "Good";
  return "Strong";
}
function strengthColor(score: number) {
  if (score <= 2) return "error";
  if (score === 3) return "warning";
  if (score === 4) return "info";
  return "success";
}
export default function Register() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Form>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const { setUser } = useAuth();
 
  const pwd = watch("password") || "";
  const checks = pwdStrength(pwd);
  const strengthText = useMemo(() => strengthLabel(checks.score), [checks.score]);
  const strengthPct = useMemo(() => (checks.score / 5) * 100, [checks.score]);
  const strengthMuiColor = useMemo(() => strengthColor(checks.score), [checks.score]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      setServerError(null);

      // Trim inputs to prevent validation errors (common with mobile autofill/copy-paste)
      const payload = {
        ...values,
        email: values.email?.trim().toLowerCase(),
        username: values.username?.trim(),
        name: values.name?.trim() || undefined,
      };

      const resp = await authApi.register(payload) as
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
      setServerError(e?.message ?? "Registration failed");
    }
  });

  return (
    <AuthLayout title="Join CUCO" subtitle="Start connecting, reflecting, and supporting each other.">
      <Paper elevation={0} className="auth-card">
        <div className="auth-header">
          <Typography variant="h5" fontWeight={700}>Create an account</Typography>
          <Typography className="auth-help" variant="body2">A few quick details and you’re in.</Typography>
        </div>

        {serverError && <Alert severity="error" sx={{ mb: 1 }}>{serverError}</Alert>}

        <Box component="form" onSubmit={onSubmit} className="auth-form" autoComplete="off">
          <TextField
            label="Name (optional)"
            variant="outlined"
            size="medium"
            autoComplete="off"
            {...register("name")}
          />

          <TextField
            label="Email"
            type="email"
            autoComplete="off"
            variant="outlined"
            size="medium"
            error={!!errors.email}
            helperText={errors.email ? "Valid email is required" : ""}
            {...register("email", { required: true })}
          />

          <TextField
            label="Username"
            variant="outlined"
            size="medium"
            autoComplete="off"
            error={!!errors.username}
            helperText={errors.username ? "Username is required (min 3)" : ""}
            {...register("username", { required: true, minLength: 3 })}
          />
                <Tooltip
                  placement="left"
                  title={
                    <Box sx={{ p: 0.5 }}>
                      <Typography variant="caption" color={checks.len ? "success.main" : "text.primary"}>
                        {checks.len ? "✓" : "•"} At least 8 characters
                      </Typography><br/>
                      <Typography variant="caption" color={checks.lower ? "success.main" : "text.primary"}>
                        {checks.lower ? "✓" : "•"} Lowercase letter
                      </Typography><br/>
                      <Typography variant="caption" color={checks.upper ? "success.main" : "text.primary"}>
                        {checks.upper ? "✓" : "•"} Uppercase letter
                      </Typography><br/>
                      <Typography variant="caption" color={checks.digit ? "success.main" : "text.primary"}>
                        {checks.digit ? "✓" : "•"} Number
                      </Typography><br/>
                      <Typography variant="caption" color={checks.special ? "success.main" : "text.primary"}>
                        {checks.special ? "✓" : "•"} Symbol
                      </Typography>
                    </Box>
                  }
                  arrow
                >
          <TextField
            label="Password"
            type={showPwd ? "text" : "password"}
            autoComplete="off"
            variant="outlined"
            size="medium"
            error={!!errors.password}
            helperText={errors.password ? "Min 8 characters (mix recommended)" : ""}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={pwd ? strengthText : ""} arrow placement="top">
                  <Box
            aria-label={`password strength ${strengthText}`}
            sx={{
              width: 6,
              height: 24,
              borderRadius: 3,
              position: "relative",
              overflow: "hidden",
              bgcolor: "action.disabledBackground",
              flexShrink: 0,
            }}
          >
            <Box
              sx={(theme) => ({
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: `${Math.max(8, Math.round(strengthPct))}%`, // min visible fill
                transition: "height 200ms ease",
                backgroundColor:
                  theme.palette[(strengthMuiColor)].main, // error | warning | info | success
              })}
            />
          </Box>


                  </Tooltip>
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
            {...register("password", { required: true, minLength: 8 })}
          />
</Tooltip>

          <div className="auth-actions">
            <Button type="submit" variant="contained" disabled={isSubmitting} className="auth-submit">
              {isSubmitting ? "Creating…" : "Create account"}
            </Button>
            <Typography className="auth-small">
              Already have an account?{" "}
              <Link component={RouterLink} to="/login">Sign in</Link>
            </Typography>
          </div>
        </Box>
      </Paper>
    </AuthLayout>
  );
}
