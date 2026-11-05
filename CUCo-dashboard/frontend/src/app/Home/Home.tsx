import "./Home.css"
import { useAuth } from "../../features/auth/AuthContext"
import HomeDashboard from "./HomeDashboard"
import { Box, Typography, Button, Container, Card, CardContent } from "@mui/material"
import { useNavigate } from "react-router-dom"
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"
import PetsIcon from "@mui/icons-material/Pets"
import PanToolAltIcon from "@mui/icons-material/PanToolAltOutlined"
import SportsEsportsIcon from "@mui/icons-material/SportsEsports"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"

export default function Home() {
  const { user } = useAuth();
  const nav = useNavigate();

  if (user) {
    return <HomeDashboard />
  }

  return (
    <Box sx={{ py: 6, backgroundColor: "background.default", minHeight: "100vh" }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
            Welcome to CUCo <EmojiEventsIcon sx={{ fontSize: 40 }} />
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: "auto" }}>
            A comprehensive healthcare dashboard for tracking your wellness journey with gamification and social support
          </Typography>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => nav("/login")}
              endIcon={<ArrowForwardIcon />}
            >
              Login
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => nav("/register")}
            >
              Sign Up
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 3, mt: 4 }}>
          <Box>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                  <PetsIcon /> Individual View
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Track your personal wellness journey with a virtual pet companion that grows as you engage with your mental health.
                </Typography>
                <Typography variant="body2">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}><CheckCircleIcon sx={{ fontSize: 20 }} /> Diary entries</Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}><CheckCircleIcon sx={{ fontSize: 20 }} /> Emotion tracking</Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}><CheckCircleIcon sx={{ fontSize: 20 }} /> Exercises & streaks</Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><CheckCircleIcon sx={{ fontSize: 20 }} /> Psychology tests</Box>
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                  <PanToolAltIcon /> Network View
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Build and manage your support circle. Share activities with trusted connections and track relationships.
                </Typography>
                <Typography variant="body2">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}><CheckCircleIcon sx={{ fontSize: 20 }} /> Social connections</Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}><CheckCircleIcon sx={{ fontSize: 20 }} /> Activity sharing</Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}><CheckCircleIcon sx={{ fontSize: 20 }} /> Consent management</Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><CheckCircleIcon sx={{ fontSize: 20 }} /> Support network</Box>
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                  <SportsEsportsIcon /> Gamification
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Stay motivated with achievement systems, streaks, and rewards for consistent engagement.
                </Typography>
                <Typography variant="body2">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}><CheckCircleIcon sx={{ fontSize: 20 }} /> Energy points</Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}><CheckCircleIcon sx={{ fontSize: 20 }} /> Achievement streaks</Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}><CheckCircleIcon sx={{ fontSize: 20 }} /> Pet customization</Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><CheckCircleIcon sx={{ fontSize: 20 }} /> Shop & inventory</Box>
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
