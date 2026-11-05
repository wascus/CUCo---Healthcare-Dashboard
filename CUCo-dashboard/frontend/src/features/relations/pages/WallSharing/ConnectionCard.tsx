import {
  Card,
  CardContent,
  CardActions,
  Stack,
  Avatar,
  Typography,
  Chip,
  Button,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DoNotDisturbOnIcon from "@mui/icons-material/DoNotDisturbOn";
import type {
  ConnectionView,
  RelationshipType,
  AccessLevel,
} from "../../../../services/connections";
import { prettyAccess } from "./constants";

function fmtRemaining(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return "expired";
  const days = Math.floor(ms / (24 * 3600_000));
  if (days > 0) return `${days}d`;
  const hours = Math.floor(ms / 3600_000);
  if (hours > 0) return `${hours}h`;
  const minutes = Math.floor(ms / 60_000);
  return `${minutes}m`;
}

const REL_OPTS: RelationshipType[] = [
  "BEST_FRIEND",
  "GOOD_FRIEND",
  "PARTNER",
  "PARENT",
  "CHILD",
  "SIBLING",
  "AUNT_UNCLE",
  "COUSIN",
  "THERAPIST",
  "DOCTOR",
  "OTHER",
];

type ConnectionCardProps = {
  c: ConnectionView & { expiresAt?: string | null; customBase?: AccessLevel | null };
  onRelationship: (r: RelationshipType) => void;
  onAccess: (a: AccessLevel) => void;
  onRemove: () => void;
  onTimedGrant: () => void;      // opens the expiry dialog (only relevant for CUSTOM)
  onClearExpiry: () => void;     // clears expiry (CUSTOM only)
  onResendInvite?: (nextExpiresAt?: string | null) => void; // invite renewal for PENDING+expired
  pendingExpiresAt?: string | null; // optimistic display right after apply
};

export default function ConnectionCard(props: ConnectionCardProps) {
  const {
    c,
    onRelationship,
    onAccess,
    onRemove,
    onTimedGrant,
    onClearExpiry,
    onResendInvite,
    pendingExpiresAt,
  } = props;

  const display =
    c.targetUser?.name ??
    c.targetUser?.username ??
    c.contact?.displayName ??
    "Unknown";

  const isCustom = c.accessLevel === "CUSTOM";
  const base = (c as any).customBase as AccessLevel | undefined;

  // Which expiry do we want to show?
  // - If status is PENDING => treat expiresAt as INVITE expiry
  // - Else if access is CUSTOM => treat expiresAt as ACCESS expiry
  const showInviteExpiry = c.status === "PENDING";
  const showAccessExpiry = !showInviteExpiry && isCustom;

  const effectiveExpiresAt =
    pendingExpiresAt ?? c.expiresAt ?? null;

  const remaining = fmtRemaining(effectiveExpiresAt);

  const showExpiryChip =
    !!effectiveExpiresAt && (showInviteExpiry || showAccessExpiry);

  const accessChipLabel = isCustom
    ? (c.expiresAt
        ? `${prettyAccess(base ?? "custom")}: ${new Date(c.expiresAt).toLocaleString()}`
        : `${prettyAccess(base ?? "custom")}`)
    : prettyAccess(c.accessLevel);

  const accessChipTooltip =
    isCustom && c.expiresAt
      ? `Temporary ${prettyAccess(base ?? "custom")} until ${new Date(
          c.expiresAt
        ).toLocaleString()}`
      : undefined;

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: "primary.light" }}>
            {display[0]?.toUpperCase() || "?"}
          </Avatar>

          <Stack spacing={0.5} flex={1} minWidth={0}>
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                {display}
              </Typography>

              {/* Always show Pending status if PENDING */}
              {c.status === "PENDING" && (
                <Chip size="small" color="warning" label="Pending" />
              )}

              {/* Expiry chip:
                  - For PENDING: shows invite expiration
                  - For CUSTOM: shows access expiration
               */}
              {showExpiryChip && (
                <Tooltip
                  title={effectiveExpiresAt ? new Date(effectiveExpiresAt).toLocaleString() : ""}
                >
                  <Chip
                    size="small"
                    color={remaining === "expired" ? "error" : "info"}
                    icon={<AccessTimeIcon fontSize="small" />}
                    label={
                      remaining === "expired"
                        ? "expired"
                        : `expires ${remaining}`
                    }
                    sx={{ ml: 0.5 }}
                  />
                </Tooltip>
              )}
            </Stack>

            {/* Meta chips */}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip size="small" label={c.targetUser ? "user" : "contact"} />
              <Chip
                size="small"
                variant="outlined"
                color="primary"
                label={c.relationship.replace(/_/g, " ").toLowerCase()}
              />
              <Tooltip title={accessChipTooltip}>
                <Chip
                  size="small"
                  variant="outlined"
                  color={isCustom ? "secondary" : "default"}
                  label={accessChipLabel}
                />
              </Tooltip>
            </Stack>
          </Stack>
        </Stack>

        {/* Controls */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} mt={2}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Relationship</InputLabel>
            <Select
              value={c.relationship}
              label="Relationship"
              onChange={(e) =>
                onRelationship(e.target.value as RelationshipType)
              }
            >
              {REL_OPTS.map((r) => (
                <MenuItem key={r} value={r}>
                  {r.replace(/_/g, " ").toLowerCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Access</InputLabel>
            <Select
              value={c.accessLevel}
              label="Access"
              onChange={(e) => onAccess(e.target.value as AccessLevel)}
            >
              <MenuItem value="NONE">none</MenuItem>
              <MenuItem value="POSITIVE_ONLY">positive only</MenuItem>
              <MenuItem value="NEGATIVE_ONLY">negative only</MenuItem>
              <MenuItem value="FULL">full</MenuItem>
              <MenuItem value="CUSTOM">custom</MenuItem>
            </Select>
          </FormControl>

          {/* Expiry actions — ONLY for CUSTOM access */}
          {isCustom && (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Button
                onClick={onTimedGrant}
                variant="outlined"
                startIcon={<AccessTimeIcon />}
                sx={{ whiteSpace: "nowrap" }}
              >
                {c.expiresAt ? "Change expiry…" : "Set expiry…"}
              </Button>

              {c.expiresAt && (
                <Tooltip title="Remove expiry (keep access base)">
                  <Button
                    color="warning"
                    variant="text"
                    onClick={onClearExpiry}
                    startIcon={<DoNotDisturbOnIcon />}
                  >
                    Clear expiry
                  </Button>
                </Tooltip>
              )}
            </Stack>
          )}

          {/* Resend invite — ONLY when PENDING and the invite is expired */}
          {c.status === "PENDING" && remaining === "expired" && (
            <Button
              variant="contained"
              onClick={() => onResendInvite && onResendInvite(null)}
              sx={{ whiteSpace: "nowrap" }}
            >
              Resend invite
            </Button>
          )}
        </Stack>
      </CardContent>

      <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
        <Button color="error" variant="outlined" onClick={onRemove}>
          revoke
        </Button>
      </CardActions>
    </Card>
  );
}
