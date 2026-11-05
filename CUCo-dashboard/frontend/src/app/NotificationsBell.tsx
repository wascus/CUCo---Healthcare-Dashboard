import { useMemo, useState } from "react";
import {
  Badge, IconButton, Menu, MenuItem, ListItemText, Divider, Tooltip} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ClearIcon from "@mui/icons-material/Clear";
import DescriptionIcon from "@mui/icons-material/Description";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  type Notification,
} from "../services/notifications";
import { useRespondToInvite } from "../services/connections";
import ConsentDialog from "./ConsentDialog";


export default function NotificationsBell() {
  const { data: allItems = [] } = useNotifications();
  const items = useMemo(() => allItems.filter((n) => n.status === "UNREAD"), [allItems]);
  const unread = items.length;

  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const delOne  = useDeleteNotification();
  const respond = useRespondToInvite(); // expects { id, action, consentVersion? }

  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [pendingConsent, setPendingConsent] = useState<Notification | null>(null);

  // Open agreement dialog for a specific notification
  const openConsent = (n: Notification) => {
    setPendingConsent(n);
    setConsentOpen(true);
  };
  const closeConsent = () => {
    setConsentOpen(false);
    setPendingConsent(null);
  };

  // Accept after scroll
  const acceptWithConsent = async () => {
    const n = pendingConsent;
    if (!n) return;
    const connectionId = n.connection?.id ?? (n.payload as any)?.connectionId;
    try {
      if (connectionId) {
        await respond.mutateAsync({ id: connectionId, action: "accept"});
      }
      await markOne.mutateAsync(n.id);
    } finally {
      closeConsent();
    }
  };

  // Decline from the menu row
  const handleDecline = async (n: Notification) => {
    const connectionId = n.connection?.id ?? (n.payload as any)?.connectionId;
    try {
      if (connectionId) {
        await respond.mutateAsync({ id: connectionId, action: "decline" });
      }
      await markOne.mutateAsync(n.id);
    } catch {
      // As a fallback, allow hard delete to clear the UI
      await delOne.mutateAsync(n.id);
    }
  };

  // Simple dismiss (no accept/decline)
  const handleDismiss = async (n: Notification) => {
    try {
      await markOne.mutateAsync(n.id);
    } catch {
      await delOne.mutateAsync(n.id);
    }
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton color="inherit" onClick={(e) => setAnchor(e.currentTarget)} aria-label="Notifications">
          <Badge badgeContent={unread} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        PaperProps={{ sx: { width: 380, maxHeight: 520 } }}
      >
        <MenuItem disabled>
          <ListItemText
            primary="Notifications"
            secondary={unread ? `${unread} unread` : "All caught up"}
          />
          {unread > 0 && (
            <Tooltip title="Mark all as read">
              <IconButton size="small" onClick={() => markAll.mutate()} aria-label="Mark all as read">
                <DoneAllIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </MenuItem>
        <Divider />

        {items.length === 0 && <MenuItem disabled>No notifications yet</MenuItem>}

        {items.map((n) => {
          const connectionId = n.connection?.id ?? (n.payload as any)?.connectionId ?? null;
          const isInvite = n.type === "INVITE_RECEIVED" && !!connectionId;
          console.log(n);
          
          return (
            <MenuItem key={n.id} dense divider>
              <ListItemText
                primary={
                  isInvite
                    ? `${n.actor?.name ?? n.actor?.username ?? "Someone"} asked to share their data with you`
                    : n.type === "INVITE_RESPONSE"
                    ? `Your request was ${n.payload?.accepted ? "accepted" : "declined"}`
                    : n.title ?? "Notification"
                }
                secondary={new Date(n.createdAt).toLocaleString()}
              />

              {isInvite ? (
                <>
                  {/* Read agreement (opens dialog) */}
                  <Tooltip title="Read agreement to accept">
                    <IconButton size="small" onClick={() => openConsent(n)} aria-label="Read agreement">
                      <DescriptionIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  {/* Decline directly */}
                  <Tooltip title="Decline">
                    <IconButton size="small" onClick={() => handleDecline(n)} aria-label="Decline">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                // Non-invite: simple dismiss
                <Tooltip title="Dismiss">
                  <IconButton size="small" onClick={() => handleDismiss(n)} aria-label="Dismiss">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </MenuItem>
          );
        })}
      </Menu>

      {/* Consent dialog */}
      <ConsentDialog
        open={consentOpen}
        onClose={closeConsent}
        onAccept={acceptWithConsent}
      />
    </>
  );
}
