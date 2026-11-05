import { useMemo, useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
  Divider,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import "./WallSharing.css";

import {
  getConnections,
  createConnectionForUser,
  createConnectionForContact,
  inviteByEmail as inviteByEmailApi,
  patchConnection,
  removeConnection as removeConnectionApi,
  type ConnectionView,
  type RelationshipType,
  type AccessLevel,
  renewConnection,
} from "../../../../services/connections";

import { useAsync } from "./hooks/useAsync";
import ConnectionCard from "./ConnectionCard";
import GrantDialog, { type GrantLevel } from "./GrantDialog";
import AddPersonDialog, { type AddDialogSubmit } from "./AddPersonDialog";
import {
  GROUPS,
  type GroupKey,
  bucketOf,
  prettyAccess,
  groupTitleForRelationship,
} from "./constants";
import { toLocalInputValue } from "./time";

type ConnWithExpiry = ConnectionView & {
  expiresAt?: string | null;
  customBase?: AccessLevel | null;
  expires_at?: string | null;
  custom_base?: AccessLevel | null;
  access?: { expiresAt?: string | null; customBase?: AccessLevel | null } | null;
};

const getGroupIcon = (iconName: string) => {
  const icons: Record<string, React.ComponentType> = {
    "EmojiEmotions": EmojiEmotionsIcon,
    "SentimentSatisfiedAlt": SentimentSatisfiedAltIcon,
    "LocalHospital": LocalHospitalIcon,
  };
  const Icon = icons[iconName];
  return Icon ? <Icon /> : null;
};

export default function WallSharing() {
  const [version, setVersion] = useState(0);
  const { data, isLoading, error } = useAsync<ConnectionView[]>(
    getConnections,
    [version]
  );

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });
  const openToast = (
    message: string,
    severity: "success" | "error" | "info" | "warning" = "success"
  ) => setToast({ open: true, message, severity });
  const closeToast = () => setToast((t) => ({ ...t, open: false }));

  // normalize server fields
  const listRaw = (data ?? []) as ConnWithExpiry[];
  const list = useMemo(
    () =>
      listRaw.map((c) => {
        const normalizedExpires =
          c.expiresAt ?? c.expires_at ?? c.access?.expiresAt ?? null;
        const normalizedBase =
          c.customBase ?? c.custom_base ?? c.access?.customBase ?? null;

        return {
          ...c,
          expiresAt: normalizedExpires,
          customBase: normalizedBase,
        } as ConnWithExpiry;
      }),
    [listRaw]
  );

  const grouped = useMemo(() => {
    const m: Record<GroupKey, (typeof list)[number][]> = {
      supporters: [],
      acquaintances: [],
      professionals: [],
    };
    list.forEach((c) => m[bucketOf(c)].push(c));
    return m;
  }, [list]);

  // optimistic expiry (cleared when server sends a value)
  const [pendingExpiry, setPendingExpiry] = useState<Record<string, string | null>>({});
  useEffect(() => {
    const serverById: Record<string, string | null> = Object.fromEntries(
      list.map((c: any) => [c.id, c.expiresAt ?? null])
    );
    setPendingExpiry((prev) => {
      let changed = false;
      const copy = { ...prev };
      for (const id of Object.keys(copy)) {
        if (serverById[id]) {
          delete copy[id];
          changed = true;
        }
      }
      return changed ? copy : prev;
    });
  }, [list]);

  // ----- Add person (per-group) -----
  const [openGroup, setOpenGroup] = useState<GroupKey | null>(null);
  const openAddDialog = (k: GroupKey) => setOpenGroup(k);
  const closeAddDialog = () => setOpenGroup(null);

  async function handleAddSubmit(payload: AddDialogSubmit) {
    if (!openGroup) return;
    const label = GROUPS.find((g) => g.key === openGroup)!.title;
    const { personType, relationship, accessLevel } = payload;

    try {
      if (personType === "contact") {
        await createConnectionForContact({
          contact: {
            name: payload.name!.trim(),
            email: payload.email || undefined,
          },
          relationship,
          accessLevel,
          label,
          invitedVia: "CONTACT",
        });
      } else if (personType === "userId") {
        await createConnectionForUser({
          targetUserId: payload.uid!.trim(),
          relationship,
          accessLevel,
          label,
          invitedVia: "ID",
        });
      } else {
        await inviteByEmailApi({
          email: payload.userEmail!.trim().toLowerCase(),
          relationship,
          accessLevel,
          label,
        });
      }
      openToast(
        personType === "userEmail"
          ? "Invitation processed"
          : "Request sent — awaiting consent",
        "success"
      );
      closeAddDialog();
      setVersion((v) => v + 1);
    } catch (e: any) {
      openToast(e?.message || "Failed to send request", "error");
    }
  }

  // ----- Grant dialog (only for CUSTOM access) -----
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantConn, setGrantConn] = useState<ConnWithExpiry | null>(null);
  const [grantDefaults, setGrantDefaults] = useState<{
    level: GrantLevel;
    withExpiry: boolean;
    at: string;
  }>({
    level: "FULL",
    withExpiry: false,
    at: toLocalInputValue(new Date(Date.now() + 3600000)),
  });
  const [grantKey, setGrantKey] = useState(0);

  const openGrant = (c: ConnWithExpiry) => {
    const base = (c.customBase as AccessLevel | null) ?? "FULL";
    const optimistic = pendingExpiry[c.id] ?? null;
    const effectiveExpiresAt = optimistic ?? c.expiresAt ?? null;
    const start = effectiveExpiresAt
      ? new Date(effectiveExpiresAt)
      : new Date(Date.now() + 3600000);

    setGrantConn(c);
    setGrantDefaults({
      level: base === "CUSTOM" || base === "NONE" ? "FULL" : (base as GrantLevel),
      withExpiry: Boolean(effectiveExpiresAt),
      at: toLocalInputValue(start),
    });

    setGrantKey((k) => k + 1);
    setGrantOpen(true);
  };

  const closeGrant = () => {
    setGrantOpen(false);
    setGrantConn(null);
  };

  async function applyGrant(opts: {
    level: GrantLevel;
    withExpiry: boolean;
    at: string;
  }) {
    if (!grantConn) return;
    try {
      if (!opts.withExpiry) {
        setPendingExpiry((p) => ({ ...p, [grantConn.id]: null }));
        await patchConnection({
          id: grantConn.id,
          patch: {
            accessLevel: opts.level, // base level becomes the current effective access
            customBase: null,
            expiresAt: null,
          } as any,
        });
        openToast(`Granted ${prettyAccess(opts.level)} with no expiry`);
      } else {
        const expiresAtISO = new Date(opts.at).toISOString();
        setPendingExpiry((p) => ({ ...p, [grantConn.id]: expiresAtISO }));
        await patchConnection({
          id: grantConn.id,
          patch: {
            accessLevel: "CUSTOM",
            customBase: opts.level,
            expiresAt: expiresAtISO,
          } as any,
        });
        openToast(
          `Granted ${prettyAccess(opts.level)} until ${new Date(
            expiresAtISO
          ).toLocaleString()}`
        );
      }
      closeGrant();
      setVersion((v) => v + 1);
    } catch (e: any) {
      openToast(e?.message || "Failed to grant", "error");
      setPendingExpiry((p) => {
        const copy = { ...p };
        if (grantConn) delete copy[grantConn.id];
        return copy;
      });
    }
  }

  async function clearExpiry(c: ConnWithExpiry) {
    try {
      const base = (c as any).customBase as AccessLevel | undefined;
      const nextAccess =
        base && base !== "CUSTOM" && base !== "NONE" ? base : "FULL";
      setPendingExpiry((p) => ({ ...p, [c.id]: null }));
      await patchConnection({
        id: c.id,
        patch: {
          expiresAt: null,
          accessLevel: nextAccess,
          customBase: null,
        } as any,
      });
      setVersion((v) => v + 1);
      openToast("Expiry cleared");
    } catch (e: any) {
      openToast(e?.message || "Failed to clear expiry", "error");
    }
  }

  // ----- Resend invite (PENDING+expired) -----
  async function onResendInvite(c: ConnWithExpiry, nextExpiresAt?: string | null) {
    try {
      await renewConnection(c.id, nextExpiresAt ?? null);
      setVersion((v) => v + 1);
      openToast("Invite resent", "success");
    } catch (e: any) {
      openToast(e?.message || "Failed to resend invite", "error");
    }
  }

  // ----- Update & Remove -----
  async function onUpdateAccess(c: ConnWithExpiry, a: AccessLevel) {
    try {
      // If picking CUSTOM, open the expiry dialog instead of patching immediately.
      if (a === "CUSTOM") {
        openGrant(c);
        return;
      }

      // Changing away from CUSTOM means expiry is no longer applicable.
      setPendingExpiry((p) => {
        const n = { ...p };
        delete n[c.id];
        return n;
      });

      await patchConnection({
        id: c.id,
        patch: { accessLevel: a, customBase: null, expiresAt: null } as any,
      });
      setVersion((v) => v + 1);
      openToast("Updated access");
    } catch (e: any) {
      openToast(e?.message || "Failed to update access", "error");
    }
  }

  async function onUpdateRelationship(c: ConnWithExpiry, r: RelationshipType) {
    try {
      const label = groupTitleForRelationship(r);
      await patchConnection({
        id: c.id,
        patch: { relationship: r, label } as any,
      });
      setVersion((v) => v + 1);
      openToast("Updated relationship");
    } catch (e: any) {
      openToast(e?.message || "Failed to update relationship", "error");
    }
  }

  async function onRemoveConnection(c: ConnWithExpiry) {
    try {
      await removeConnectionApi(c.id);
      setVersion((v) => v + 1);
      openToast("Connection revoked");
    } catch (e: any) {
      openToast(e?.message || "Failed to revoke", "error");
    }
  }

  if (isLoading) return <Typography sx={{ p: 3 }}>Loading…</Typography>;
  if (error) return <Typography sx={{ p: 3 }}>Failed to load.</Typography>;

  return (
    <Box sx={{ bgcolor: "background.default", py: 4 }}>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={toast.open}
        onClose={closeToast}
        autoHideDuration={3000}
      >
        <Alert elevation={6} variant="filled" onClose={closeToast} severity={toast.severity} sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>

      <Container maxWidth="lg">
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
              <Stack spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 220,
                    height: 220,
                    borderRadius: "999px",
                    bgcolor: "primary.50",
                    border: 1,
                    borderColor: "divider",
                    display: "grid",
                    placeItems: "center",
                    boxShadow: "0 10px 24px rgba(21,30,70,.06)",
                  }}
                >
                  <Box sx={{ fontSize: 64 }}>😔</Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  sad day
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={3}>
              {GROUPS.map((g) => (
                <Paper key={g.key} variant="outlined" sx={{ borderRadius: 3 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      px: 2,
                      py: 1.5,
                      bgcolor: "grey.50",
                      borderBottom: 1,
                      borderColor: "divider",
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ display: "flex", alignItems: "center", fontSize: 24 }}>
                        {getGroupIcon(g.icon)}
                      </Box>
                      <Typography variant="subtitle1" fontWeight={800}>
                        {g.title}
                      </Typography>
                    </Stack>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => openAddDialog(g.key)}
                    >
                      Add
                    </Button>
                  </Stack>

                  <Divider />

                  <Stack spacing={1.5} sx={{ p: 2 }}>
                    {grouped[g.key].length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No connections yet
                      </Typography>
                    )}

                    {grouped[g.key].map((c) => (
                      <ConnectionCard
                        key={c.id}
                        c={c as any}
                        onRelationship={(r) => onUpdateRelationship(c, r)}
                        onAccess={(a) => onUpdateAccess(c, a)}
                        onRemove={() => onRemoveConnection(c)}
                        onTimedGrant={() => openGrant(c as any)}   // only used for CUSTOM
                        onClearExpiry={() => clearExpiry(c)}        // only for CUSTOM
                        onResendInvite={(next) => onResendInvite(c, next)} // PENDING+expired
                        pendingExpiresAt={pendingExpiry[c.id] ?? null}
                      />
                    ))}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* Per-group Add dialog */}
      <AddPersonDialog
        open={openGroup !== null}
        groupTitle={
          openGroup ? GROUPS.find((g) => g.key === openGroup)!.title : ""
        }
        defaults={{
          relationship: openGroup === "professionals" ? "DOCTOR" : "OTHER",
          accessLevel: openGroup === "supporters" ? "FULL" : "NONE",
        }}
        onClose={() => setOpenGroup(null)}
        onSubmit={handleAddSubmit}
      />

      {/* Timed grant dialog (only shown when Access=CUSTOM) */}
      <GrantDialog
        key={grantKey}
        open={grantOpen}
        defaultLevel={grantDefaults.level}
        withExpiry={grantDefaults.withExpiry}
        at={grantDefaults.at}
        onClose={closeGrant}
        onApply={applyGrant}
      />
    </Box>
  );
}
