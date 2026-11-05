import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Skeleton,
  Paper,
  Divider,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PeopleIcon from "@mui/icons-material/People";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AddIcon from "@mui/icons-material/Add";
import PetsIcon from "@mui/icons-material/Pets";
import StarIcon from "@mui/icons-material/Star";
import WavingHandIcon from "@mui/icons-material/PanToolAltOutlined";
import HandshakeIcon from "@mui/icons-material/Handshake";
import "./HomeDashboard.css";
import { useAuth } from "../../features/auth/AuthContext";
import { usePet } from "../../features/gamification/PetContext";
import { useDiaryNotes } from "../../services/diary";
import { useNotifications } from "../../services/notifications";
import { getConnections, type ConnectionView } from "../../services/connections";
import { getStreak } from "../../services/streak";
import type { StreakDTO } from "../../services/streak";

export default function HomeDashboard() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { petName, energyPoints, petHappiness } = usePet();
  const { data: diaryNotes = { items: [] } } = useDiaryNotes({ limit: 5 });
  const { data: notifications = [] } = useNotifications(10);
  const [connections, setConnections] = useState<ConnectionView[]>([]);
  const [streak, setStreak] = useState<StreakDTO | null>(null);
  const [streakLoading, setStreakLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [streakData, connData] = await Promise.all([
          getStreak(),
          getConnections(),
        ]);
        setStreak(streakData);
        setConnections(connData);
      } catch (error) {
        console.debug("Error fetching dashboard data:", error);
      } finally {
        setStreakLoading(false);
      }
    };
    fetchData();
  }, []);

  const recentEntries = useMemo(() => {
    return (diaryNotes.items ?? []).slice(0, 3);
  }, [diaryNotes]);

  const recentNotifications = useMemo(() => {
    return (notifications ?? []).slice(0, 3);
  }, [notifications]);

  const acceptedConnections = useMemo(() => {
    return (connections ?? []).filter((c: ConnectionView) => c.status === "ACCEPTED").length;
  }, [connections]);

  const unreadNotifications = useMemo(() => {
    return (notifications ?? []).filter((n) => n.status === "UNREAD").length;
  }, [notifications]);

  const handleStartDiary = () => nav("/individual/diary");
  const handleViewTests = () => nav("/individual/tests");
  const handleViewNetwork = () => nav("/network");
  const handleManagePet = () => nav("/individual");

  return (
    <Box className="home-dashboard">
      <Box className="dashboard-header">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
            Welcome back, {user?.name || user?.username}! <WavingHandIcon />
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Typography>
        </Box>
      </Box>

      <Box className="stats-grid" sx={{ mb: 3, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 2 }}>
        <Card className="stat-card">
          <CardContent>
            <Box className="stat-icon pet-icon"><PetsIcon sx={{ fontSize: 48 }} /></Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              Your Companion
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, mt: 1 }}>
              {petName}
            </Typography>
            <Box sx={{ mt: 1.5, display: "flex", gap: 1 }}>
              <Chip
                icon={<EmojiEventsIcon />}
                label={`${petHappiness}/100`}
                size="small"
                variant="outlined"
                color={petHappiness > 70 ? "success" : petHappiness > 40 ? "warning" : "error"}
              />
            </Box>
            <Button
              variant="text"
              size="small"
              startIcon={<EditIcon />}
              onClick={handleManagePet}
              sx={{ mt: 1 }}
            >
              Manage
            </Button>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent>
            <Box className="stat-icon streak-icon"><LocalFireDepartmentIcon sx={{ fontSize: 48 }} /></Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              Current Streak
            </Typography>
            {streakLoading ? (
              <Skeleton variant="text" width="80px" height={32} sx={{ mt: 1 }} />
            ) : (
              <>
                <Typography variant="h6" sx={{ fontWeight: 600, mt: 1 }}>
                  {streak?.currentStreak || 0} days
                </Typography>
                {streak && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    {streak.multiplier.toFixed(2)}x bonus
                  </Typography>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent>
            <Box className="stat-icon notification-icon"><NotificationsIcon sx={{ fontSize: 48 }} /></Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              Notifications
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, mt: 1 }}>
              {unreadNotifications}
            </Typography>
            {unreadNotifications > 0 && (
              <Chip
                label="Unread"
                size="small"
                color="error"
                variant="outlined"
                sx={{ mt: 1 }}
              />
            )}
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent>
            <Box className="stat-icon energy-icon"><StarIcon sx={{ fontSize: 48 }} /></Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              Energy Points
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, mt: 1 }}>
              {energyPoints}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              Available to spend
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                <AssignmentIcon fontSize="small" /> Recent Activity
              </Typography>
              <Button size="small" onClick={handleStartDiary}>
                View All
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {recentEntries.length === 0 ? (
              <Alert severity="info" sx={{ mt: 1 }}>
                No diary entries yet. Start writing!
              </Alert>
            ) : (
              <Box className="activity-list">
                {recentEntries.map((entry) => (
                  <Paper
                    key={entry.id}
                    className="activity-item"
                    sx={{
                      p: 1.5,
                      mb: 1.5,
                      backgroundColor: "rgba(88, 104, 243, 0.04)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": {
                        backgroundColor: "rgba(88, 104, 243, 0.08)",
                        transform: "translateX(4px)",
                      },
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 0.5 }}
                      noWrap
                    >
                      {entry.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        mb: 0.5,
                      }}
                    >
                      {entry.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                <NotificationsIcon fontSize="small" /> Recent Notifications
              </Typography>
              <Chip label={unreadNotifications} size="small" color="error" />
            </Box>

            <Divider sx={{ mb: 2 }} />

            {recentNotifications.length === 0 ? (
              <Alert severity="success" sx={{ mt: 1 }}>
                All caught up!
              </Alert>
            ) : (
              <Box className="notifications-list">
                {recentNotifications.map((notif) => (
                  <Paper
                    key={notif.id}
                    className="notification-item"
                    sx={{
                      p: 1.5,
                      mb: 1.5,
                      backgroundColor:
                        notif.status === "UNREAD"
                          ? "rgba(244, 67, 54, 0.05)"
                          : "rgba(0, 0, 0, 0.02)",
                      borderLeft:
                        notif.status === "UNREAD"
                          ? "4px solid #f44336"
                          : "4px solid transparent",
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {notif.actor?.name || notif.actor?.username || "Someone"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {notif.title || notif.type}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Quick Actions
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleStartDiary}
            >
              New Diary Entry
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<EmojiEventsIcon />}
              onClick={handleViewTests}
            >
              Psychology Tests
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<PeopleIcon />}
              onClick={handleViewNetwork}
            >
              My Network
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ backgroundColor: "rgba(88, 104, 243, 0.05)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                <HandshakeIcon sx={{ fontSize: 20 }} /> Connections
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You have {acceptedConnections} connection{acceptedConnections !== 1 ? "s" : ""} in your network
              </Typography>
            </Box>
            <Button variant="contained" onClick={handleViewNetwork} size="small">
              View Network
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
