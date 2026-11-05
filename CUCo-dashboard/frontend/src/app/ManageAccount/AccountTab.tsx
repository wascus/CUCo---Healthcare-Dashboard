import { useMemo, useState } from "react";
import {
  Box, Grid, Stack, Typography, TextField, Button, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, Alert
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import KeyIcon from "@mui/icons-material/Key";
import { api } from "../../services/api";
import { useAuth } from "../../features/auth/AuthContext";
import type { AuthUser } from "../../types/auth";

function makePlaceholder() {
  const seg = () => Math.random().toString(36).slice(2, 6);
  return `${seg()}${seg()}-${seg()}-${seg()}-${seg()}-${seg()}${seg()}${seg()}`.toUpperCase();
}

export default function AccountTab() {
  const { user, setUser } = useAuth();
  const initialName = user?.name ?? user?.username ?? "";
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  // Secure ID: never use user.id. Start with a random placeholder and only
  // put the real ID into state after the server returns it post-verification.
  const [displayedId, setDisplayedId] = useState<string>(makePlaceholder());
  const [idRevealed, setIdRevealed] = useState(false);

  const [pwMode, setPwMode] = useState<null | "reveal" | "delete">(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dirty = useMemo(() => name.trim() && name.trim() !== initialName, [name, initialName]);

  const handleSave = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      await api.patch("/auth/profile", { name: name.trim() });
      setUser({ ...(user as AuthUser), name: name.trim() });
    } catch (e) {
      alert((e as Error).message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const openReveal = () => { setErrorMsg(null); setPwMode("reveal"); setPassword(""); };
  const openDelete = () => { setErrorMsg(null); setPwMode("delete"); setPassword(""); };
  const closeDialog = () => { setPwMode(null); setPassword(""); setBusy(false); setErrorMsg(null); };

  const submitPassword = async () => {
    if (!pwMode) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      if (pwMode === "reveal") {
        // Ask server for the ID only after password verification
        const res = await api.post<{ userId: string }>("/auth/user-id", { password });
        setDisplayedId(res.userId);   // now we finally put real ID in DOM
        setIdRevealed(true);
        closeDialog();
      } else {
        // Delete flow: verify & delete in one go
        await api.post("/auth/delete-account", { password });
        window.location.href = "/";
      }
    } catch {
      setErrorMsg("Incorrect password. Please try again.");
      setBusy(false);
    }
  };

  return (
    <Box component="section" sx={{ bgcolor: "background.paper", borderRadius: 2, p: 0 }}>
      {/* Header left | Form right */}
      <Grid container alignItems="flex-start" spacing={2} sx={{ px: 2, py: 2 }}>
        <Grid size={{xs:12, md:3}}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Profile</Typography>
        </Grid>

        <Grid size={{xs:12, md:9}}>
          <Stack spacing={2} divider={<Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />}>
            {/* Name */}
            <Box>
              <Grid container spacing={2}>
                <Grid size={{xs:12, md:6}}>
                  <TextField
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    variant="standard"
                    autoComplete="off"
                    InputProps={{
                      endAdornment: dirty ? (
                        <InputAdornment position="end">
                          <Button
                            onClick={handleSave}
                            variant="contained"
                            size="small"
                            disabled={saving}
                          >
                            {saving ? "Saving…" : "Save changes"}
                          </Button>
                        </InputAdornment>
                      ) : undefined,
                    }}
                    helperText="Update how your name appears to others"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Secure User ID */}
            <Box>
              <Grid container alignItems="center" spacing={2}>
                <Grid size={{xs:12, md:8}}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    User ID
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      // if not revealed, still blur the placeholder to match UX
                      filter: idRevealed ? "none" : "blur(6px)",
                      userSelect: idRevealed ? "text" : "none",
                      transition: "filter .2s ease",
                      p: 1,
                      borderRadius: 1,
                      bgcolor: (t) => t.palette.mode === "dark" ? "grey.900" : "grey.50",
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    }}
                    aria-label={idRevealed ? "User ID" : "Obfuscated user ID"}
                    aria-live="polite"
                  >
                    {displayedId}
                  </Typography>
                </Grid>
                <Grid size={{xs:12, md:4}}>
                  <Stack direction="row" justifyContent={{ xs: "flex-start", md: "flex-end" }}>
                    <Tooltip title={idRevealed ? "User ID visible" : "Reveal user ID"}>
                      <span>
                        <Button
                          variant="outlined"
                          startIcon={<VisibilityIcon />}
                          disabled={idRevealed}
                          onClick={openReveal}
                        >
                          {idRevealed ? "Visible" : "Reveal"}
                        </Button>
                      </span>
                    </Tooltip>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </Grid>
      </Grid>

      {/* Divider */}
      <Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />

      {/* Delete account */}
      <Grid container alignItems="center" spacing={2} sx={{ px: 2, py: 2 }}>
        <Grid size={{xs:12, md:3}}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Delete account</Typography>
        </Grid>
        <Grid size={{xs:12, md:9}}>
          <Grid container alignItems="center">
            <Grid size={{xs:12, md:8}}>
              <Typography variant="body2" color="error" sx={{ fontWeight: 600 }} component="span">
                Warning:&nbsp;
              </Typography>
              <Typography variant="body2" color="text.secondary" component="span">
                This action is permanent and cannot be undone.
              </Typography>
            </Grid>
            <Grid size={{xs:12, md:4}}>
              <Stack direction="row" justifyContent={{ xs: "flex-start", md: "flex-end" }}>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteForeverIcon />}
                  onClick={openDelete}
                  sx={{
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": { boxShadow: "none", filter: "brightness(0.95)" },
                  }}
                >
                  Delete account
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Password dialog (reveal/delete) */}
      <Dialog open={pwMode !== null} onClose={busy ? undefined : closeDialog} fullWidth maxWidth="xs">
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <KeyIcon fontSize="small" />
          {pwMode === "delete" ? "Confirm deletion" : "Verify your password"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {pwMode === "delete" ? (
              <Alert severity="warning" variant="outlined">
                Deleting your account is permanent and cannot be undone.
              </Alert>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Enter your password to reveal your user ID.
              </Typography>
            )}
            <TextField
              type="password"
              label="Password"
              value={password}
              autoFocus
              autoComplete="off"
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={busy}>Cancel</Button>
          <Button
            onClick={submitPassword}
            disabled={busy || !password}
            variant="contained"
            color={pwMode === "delete" ? "error" : "primary"}
          >
            {busy ? (pwMode === "delete" ? "Deleting…" : "Verifying…") : (pwMode === "delete" ? "Delete" : "Verify")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
