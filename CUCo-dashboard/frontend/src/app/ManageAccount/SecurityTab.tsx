import { useMemo, useState } from "react";
import {
  Box,
  Grid,
  Stack,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import KeyIcon from "@mui/icons-material/Key";
import { api } from "../../services/api";
import { useAuth } from "../../features/auth/AuthContext";
import type { AuthUser } from "../../types/auth";

/* -------- password helpers -------- */
function passwordChecks(pw: string) {
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

export default function SecurityTab() {
  const { user, setUser } = useAuth();

  /* ----- Change password state ----- */
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const checks = passwordChecks(newPw);
  const pwMatch = newPw.length > 0 && newPw === confirmPw;
  const canSavePw = checks.len && pwMatch;

  /* dialog to ask for current password on save */
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [busyPw, setBusyPw] = useState(false);
  const [pwErr, setPwErr] = useState<string | null>(null);

  /* ----- Change email state ----- */
  const [newEmail, setNewEmail] = useState("");
  const emailChanged = !!newEmail && newEmail !== user?.email;

  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailPw, setEmailPw] = useState("");
  const [busyEmail, setBusyEmail] = useState(false);
  const [emailErr, setEmailErr] = useState<string | null>(null);

  const strengthPct = useMemo(() => (checks.score / 5) * 100, [checks.score]);
  const strengthText = useMemo(() => strengthLabel(checks.score), [checks.score]);
  const strengthMuiColor = useMemo(() => strengthColor(checks.score), [checks.score]);

  /* -------- actions -------- */
  const submitChangePassword = async () => {
    setBusyPw(true);
    setPwErr(null);
    try {
      await api.post("/auth/change-password", {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      setNewPw("");
      setConfirmPw("");
      setCurrentPw("");
      setPwDialogOpen(false);
    } catch (e) {
      setPwErr((e as Error).message || "Failed to change password");
    } finally {
      setBusyPw(false);
    }
  };

  const submitChangeEmail = async () => {
    setBusyEmail(true);
    setEmailErr(null);
    try {
      await api.post("/auth/change-email", { newEmail, password: emailPw });
      setUser({ ...(user as AuthUser), email: newEmail });
      setEmailPw("");
      setEmailDialogOpen(false);
    } catch (e) {
      setEmailErr((e as Error).message || "Failed to change email");
    } finally {
      setBusyEmail(false);
    }
  };

  return (
    <Box component="section" sx={{ bgcolor: "background.paper", borderRadius: 2, p: 0 }}>
      {/* ----- Change password block ----- */}
      <Grid container alignItems="flex-start" spacing={2} sx={{ px: 2, py: 2 }}>
        <Grid size={{ xs:12, md:3}}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Change password
          </Typography>
        </Grid>

        <Grid size={{ xs:12, md:9}}>
          <Stack spacing={2}>
            {/* fields row */}
            <Grid container spacing={2}>
              <Grid size={{ xs:12, md:6}}>
                <Tooltip
                  placement="bottom-start"
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
  label="New password"
  fullWidth
  type={showNew ? "text" : "password"}
  value={newPw}
  onChange={(e) => setNewPw(e.target.value)}
  variant="standard"
  autoComplete="off"
  InputProps={{
    endAdornment: (
      <InputAdornment position="end" sx={{ gap: 1 }}>
        {/* Vertical strength bar */}
        <Tooltip title={newPw ? strengthText : ""} arrow placement="top">
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

        {/* Eye icon */}
        <IconButton
          aria-label={showNew ? "Hide password" : "Show password"}
          onClick={() => setShowNew((v) => !v)}
          edge="end"
        >
          {showNew ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </InputAdornment>
    ),
  }}
  helperText={
    !checks.len && newPw.length > 0
      ? "Your password needs to be at least 8 characters long"
      : " "
  }
  FormHelperTextProps={{ sx: { mt: 1 } }}
/>
                </Tooltip>
              
              </Grid>

              <Grid size={{ xs:12, md:6}}>
                <TextField
                  label="Confirm new password"
                  fullWidth
                  type={showConfirm ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  variant="standard"
                  autoComplete="off"
                  error={confirmPw.length > 0 && !pwMatch}
                  helperText={confirmPw.length > 0 && !pwMatch ? "Passwords do not match" : " "}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showConfirm ? "Hide password" : "Show password"}
                          onClick={() => setShowConfirm((v) => !v)}
                          edge="end"
                        >
                          {showConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  FormHelperTextProps={{ sx: { mt: 1 } }}
                />
              </Grid>
            </Grid>

            <Stack direction="row" justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={() => setPwDialogOpen(true)}
                disabled={!canSavePw}
              >
                Save password
              </Button>
            </Stack>

            <Box sx={{ borderTop: "1px solid", borderColor: "divider", mt: 1 }} />
          </Stack>
        </Grid>
      </Grid>

      {/* ----- Change email block ----- */}
      <Grid container alignItems="flex-start" spacing={2} sx={{ px: 2, pb: 2 }}>
        <Grid size={{ xs:12, md:3}}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Change email address
          </Typography>
        </Grid>

        <Grid size={{ xs:12, md:9}}>
          <Grid container spacing={2}>
            <Grid size={{ xs:12, md:6}}>
              <TextField
                label="Current email address"
                value={user?.email ?? ""}
                fullWidth
                variant="standard"
                autoComplete="off"
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailOutlineIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs:12, md:6}}>
              <TextField
                label="New email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                fullWidth
                variant="standard"
                type="email"
                autoComplete="off"
              />
            </Grid>
          </Grid>

          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={() => setEmailDialogOpen(true)}
              disabled={!emailChanged}
            >
              Update email
            </Button>
          </Stack>
        </Grid>
      </Grid>

      {/* ----- Current password dialog for changing password ----- */}
      <Dialog open={pwDialogOpen} onClose={busyPw ? undefined : () => setPwDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <KeyIcon fontSize="small" />
          Confirm current password
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              For your security, please confirm your current password to save the new one.
            </Typography>
            <TextField
              type="password"
              label="Current password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              autoComplete="off"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            {pwErr && <Alert severity="error">{pwErr}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPwDialogOpen(false)} disabled={busyPw}>Cancel</Button>
          <Button
            onClick={submitChangePassword}
            disabled={busyPw || !currentPw}
            variant="contained"
          >
            {busyPw ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ----- Password dialog for updating email ----- */}
      <Dialog open={emailDialogOpen} onClose={busyEmail ? undefined : () => setEmailDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <KeyIcon fontSize="small" />
          Confirm your password
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Enter your password to update your email address.
            </Typography>
            <TextField
              type="password"
              label="Password"
              value={emailPw}
              onChange={(e) => setEmailPw(e.target.value)}
              autoComplete="off"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            {emailErr && <Alert severity="error">{emailErr}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)} disabled={busyEmail}>Cancel</Button>
          <Button
            onClick={submitChangeEmail}
            disabled={busyEmail || !emailPw || !emailChanged}
            variant="contained"
          >
            {busyEmail ? "Updating…" : "Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
