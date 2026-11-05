import * as React from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Tooltip,
} from "@mui/material";
import { getViewers, type ViewerCard } from "../../../../services/consents";
import ConsentDetailDialog from "./ConsentDetailDialog";
import { isExpired } from "../../../../services/connections";

function fmtShort(d?: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt.toLocaleDateString();
}
function fmtLong(d?: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt.toLocaleString();
}

export default function Consent() {
  const [items, setItems] = React.useState<ViewerCard[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [selectedOwner, setSelectedOwner] = React.useState<ViewerCard["fromUser"] | null>(null);

  React.useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setError(null);

    getViewers(abort.signal)
      .then((res) => setItems(res))
      .catch((e: any) => {
        if (e?.__aborted || e?.name === "AbortError") return;
        setError(e?.message || "Failed to load viewers");
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });

    return () => abort.abort();
  }, []);

  const openDetails = (owner: ViewerCard["fromUser"]) => setSelectedOwner(owner);
  const closeDetails = () => setSelectedOwner(null);

  const titleFor = (v: ViewerCard) =>
    v.fromUser?.name ?? v.fromUser?.username ?? v.fromUser?.email ?? "Unknown user";

  const subheaderFor = (v: ViewerCard) => {
    const emailOrUser = v.fromUser?.email ?? v.fromUser?.username ?? undefined;
    return v.label ? `${v.label} ${emailOrUser ? `• ${emailOrUser}` : ""}` : emailOrUser ?? "—";
  };

  const initialFor = (v: ViewerCard) => {
    const t = titleFor(v);
    return (t && t[0] ? t[0] : "?").toUpperCase();
  };

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>
        People sharing with you
      </Typography>

      {loading && (
        <Box display="flex" alignItems="center" gap={1}>
          <CircularProgress size={20} />
          <Typography variant="body2">Loading…</Typography>
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (items?.length ?? 0) === 0 && (
        <Alert severity="info">No one is sharing topics with you yet.</Alert>
      )}

      <Grid container spacing={2} mt={0.5}>
        {(items ?? []).map((v) => {
          const short = fmtShort(v.expiresAt);
          const long = fmtLong(v.expiresAt);
          const hasExpiry = Boolean(short);

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={v.id}>
              <Card variant="outlined">
                <CardHeader
                  avatar={<Avatar>{initialFor(v)}</Avatar>}
                  title={titleFor(v)}
                  subheader={subheaderFor(v)}
                />
                <CardContent sx={{ pt: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                    <Typography variant="body2" color="text.secondary">
                      Sharing since {new Date(v.acceptedAt).toLocaleDateString()}
                    </Typography>

                    {hasExpiry && (
                      <Tooltip title={`Access expires: ${long}`}>
                        <Chip
                          size="small"
                          color="warning"
                          variant="outlined"
                          label={`expires ${short}`}
                        />
                      </Tooltip>
                    )}
                  </Stack>
                </CardContent>
                <CardActions sx={{ justifyContent: "flex-end" }}>
  <Tooltip
    title={
      isExpired(v.expiresAt)
        ? `Access expired on ${new Date(v.expiresAt!).toLocaleString()}`
        : ""
    }
  >
    <span>
      <Button
        size="small"
        disabled={isExpired(v.expiresAt)}
        onClick={() => openDetails(v.fromUser)}
      >
        View topics
      </Button>
    </span>
  </Tooltip>
</CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <ConsentDetailDialog open={!!selectedOwner} owner={selectedOwner} onClose={closeDetails} />
    </Box>
  );
}
