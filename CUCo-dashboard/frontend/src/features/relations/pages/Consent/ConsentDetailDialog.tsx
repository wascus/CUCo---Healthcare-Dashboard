import * as React from "react";
import {
  AppBar,
  Alert,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import Slide from "@mui/material/Slide";
import type { TransitionProps } from "@mui/material/transitions";
import { useTheme } from "@mui/material/styles";
import {
  getSharedTopics,
  type SharedTopic,
  type ViewerUser,
} from "../../../../services/consents";

// --- transition
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function isAbort(e: any) {
  return e?.name === "AbortError" || e?.code === 20 || /aborted/i.test(e?.message || "");
}

function fmtLong(d?: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt.toLocaleString();
}

type OwnerInfo = ViewerUser & {
  expiresAt?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  owner: OwnerInfo | null;
};

type PlacementKey = "base" | "middle" | "summit";
const ORDER: PlacementKey[] = ["base", "middle", "summit"];

function getPlacement(row: SharedTopic): PlacementKey {
  const p = (row as any)?.placement;
  return p === "middle" || p === "summit" ? p : "base";
}
function getTitle(row: SharedTopic): string {
  return (
    (row as any)?.title ??
    (row as any)?.name ??
    `Topic ${((row as any)?.id ?? "").toString()}`
  );
}
function getDescription(row: SharedTopic): string | undefined {
  return (row as any)?.description ?? undefined;
}
function getDate(row: SharedTopic): string | undefined {
  return (row as any)?.date ?? (row as any)?.createdAt ?? undefined;
}
function getStatus(row: SharedTopic): string {
  return (row as any)?.status ?? (row as any)?.state ?? "shared";
}
function getId(row: SharedTopic): string {
  return ((row as any)?.id ?? `${getPlacement(row)}-${getTitle(row)}`) as string;
}

function groupByPlacement(rows: SharedTopic[]) {
  const buckets: Record<PlacementKey, SharedTopic[]> = { base: [], middle: [], summit: [] };
  for (const r of rows) buckets[getPlacement(r)].push(r);
  return ORDER.map((key) => ({ key, items: buckets[key] }));
}

const DRAWER_WIDTH = 260;

export default function ConsentDetailDialog({ open, onClose, owner }: Props) {
  const [rows, setRows] = React.useState<SharedTopic[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const longExpiry = fmtLong(owner?.expiresAt ?? null);
  const title = owner?.name ?? owner?.username ?? owner?.email ?? "Owner";

  React.useEffect(() => {
    if (!open || !owner?.id) return;
    const ctrl = new AbortController();
    setRows(null);
    setError(null);

    getSharedTopics(owner.id, ctrl.signal)
      .then(setRows)
      .catch((e) => {
        if (isAbort(e)) return;
        setError(e?.message ?? "Failed to load topics");
      });

    return () => ctrl.abort();
  }, [open, owner?.id]);

  const modules = React.useMemo(() => {
    const list: { key: string; label: string }[] = [];
    if (rows && rows.length > 0) list.push({ key: "grief-topics", label: "GriefTopics" });
    return list;
  }, [rows]);

  const [activeModule, setActiveModule] = React.useState<string>("grief-topics");
  React.useEffect(() => {
    if (modules.length > 0 && !modules.find((m) => m.key === activeModule)) {
      setActiveModule(modules[0].key);
    }
  }, [modules, activeModule]);

  const groups = React.useMemo(() => (rows ? groupByPlacement(rows) : []), [rows]);

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH, p: 2 }}>
      <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>
        Viewing as
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        {longExpiry && (
          <Tooltip title={`Access expires: ${longExpiry}`}>
            <Chip size="small" color="warning" variant="outlined" label="expires soon" />
          </Tooltip>
        )}
      </Stack>

      <Divider sx={{ mb: 2 }} />
      <Typography variant="overline" sx={{ color: "text.secondary" }}>
        Modules
      </Typography>
      <List dense sx={{ mt: 1 }}>
        {modules.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
            No modules shared.
          </Typography>
        )}
        {modules.map((m) => (
          <ListItemButton
            key={m.key}
            selected={activeModule === m.key}
            onClick={() => {
              setActiveModule(m.key);
              if (isMobile) setDrawerOpen(false);
            }}
            sx={{ borderRadius: 1, mb: 0.5 }}
          >
            <ListItemText primary={m.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      aria-labelledby="consent-detail-dialog-title"
    >
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
          {/* Left close button */}
          <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>

          <Box sx={{ ml: 2, flex: 1, minWidth: 0 }}>
            <Typography id="consent-detail-dialog-title" variant="h6" noWrap>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }} noWrap>
              {owner?.email ?? owner?.username ?? ""}
            </Typography>
          </Box>

          {/* Mobile: open modules drawer */}
          {isMobile && modules.length > 0 && (
            <IconButton color="inherit" onClick={() => setDrawerOpen(true)} aria-label="open modules">
              <MenuIcon />
            </IconButton>
          )}

          {/* NEW: top-right close button */}
          <IconButton
            color="inherit"
            onClick={onClose}
            aria-label="close dialog"
            sx={{ position: "absolute", right: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Layout */}
      <Box sx={{ display: "flex", height: "100%" }}>
        {modules.length > 0 && (
          <>
            <Drawer
              variant={isMobile ? "temporary" : "permanent"}
              open={isMobile ? drawerOpen : true}
              onClose={() => setDrawerOpen(false)}
              ModalProps={{ keepMounted: true }}
              PaperProps={{ sx: { width: DRAWER_WIDTH } }}
            >
              {drawerContent}
            </Drawer>
            {!isMobile && <Box sx={{ width: DRAWER_WIDTH, flexShrink: 0 }} />}
          </>
        )}

        {/* Right pane */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {!rows && !error && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 2 }}>
              <CircularProgress size={20} /> <Typography>Loading…</Typography>
            </Box>
          )}

          {rows && activeModule === "grief-topics" && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {groups.map((g) => (
                <Paper variant="outlined" key={g.key} sx={{ p: 2 }}>
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{ textTransform: "capitalize" }}
                  >
                    {g.key}
                  </Typography>

                  {g.items.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No items.
                    </Typography>
                  ) : (
                    <Stack divider={<Divider flexItem />} spacing={1}>
                      {g.items.map((t) => {
                        const id = getId(t);
                        const title = getTitle(t);
                        const desc = getDescription(t);
                        const dt = getDate(t);
                        const status = getStatus(t);
                        return (
                          <Box
                            key={id}
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "1fr auto",
                              alignItems: "start",
                              gap: 1,
                              py: 0.5,
                            }}
                          >
                            <Box minWidth={0}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                {title}
                              </Typography>

                              {desc && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "text.secondary",
                                    whiteSpace: "pre-wrap",
                                    mt: 0.25,
                                  }}
                                >
                                  {desc}
                                </Typography>
                              )}

                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mt: 0.25, display: "block" }}
                              >
                                {dt ? new Date(dt).toLocaleDateString() : "No date"}
                              </Typography>
                            </Box>

                            <Chip size="small" label={status} />
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </Paper>
              ))}
            </Stack>
          )}

          {rows && rows.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No shared topics from this user.
            </Typography>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}
