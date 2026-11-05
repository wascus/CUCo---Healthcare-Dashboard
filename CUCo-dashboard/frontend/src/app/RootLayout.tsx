import { useMemo, useState, useEffect } from "react";
import { Outlet, useLocation, Link as RouterLink, useNavigate } from "react-router-dom";
import {
  AppBar, Toolbar, IconButton, Typography, Button, Box, Container,
  Avatar, Menu, MenuItem, Tooltip, Divider,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import SelfImprovementOutlinedIcon from "@mui/icons-material/SelfImprovementOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import { useAuth } from "../features/auth/AuthContext";
import NotificationsBell from "./NotificationsBell";
import { PetProvider } from '../features/gamification/PetContext';
import FloatingPetWidget from './FloatingPetWidget';
import "./App.css";

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "1.0.0";

const PROTECTED_PREFIXES = ["/dashboard", "/individual", "/network","/manage-account"];
const isProtectedPath = (p: string) => PROTECTED_PREFIXES.some((pre) => p.startsWith(pre));

export default function RootLayout() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const { user, ready, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  useEffect(() => {
    if (ready && !user && isProtectedPath(pathname)) {
      nav("/", { replace: true });
    }
  }, [ready, user, pathname, nav]);

  const initial = useMemo(() => {
    const n = user?.name?.trim() || user?.username || user?.email || "";
    return n ? n[0]!.toUpperCase() : "?";
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setAnchorEl(null);
    if (isProtectedPath(pathname)) nav("/", { replace: true });
  };

  const handleManageAccount = async () => {
    setAnchorEl(null);
    nav("/manage-account");
  }

  const NavButton = ({
    to, label, icon, activeMatch, requiresAuth = false, hideWhenLoggedOut = false,
  }: {
    to: string; label: string; icon: React.ReactNode;
    activeMatch: (p: string) => boolean;
    requiresAuth?: boolean; hideWhenLoggedOut?: boolean;
  }) => {
    const active = activeMatch(pathname);
    const authed = !!user;
    if (requiresAuth && hideWhenLoggedOut && !authed) return null;
    return (
      <Button
        component={RouterLink}
        to={requiresAuth && !authed ? "/" : to}
        startIcon={icon}
        variant={active ? "contained" : "text"}
        color={active ? "primary" : "inherit"}
        sx={{ mx: 0.5 }}
        disabled={requiresAuth && !authed}
      >
        {label}
      </Button>
    );
  };

  return (
    <PetProvider>
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
        <AppBar position="sticky" color="default" elevation={1}>
          <Toolbar sx={{ gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", width: 56 }}>
              {!isHome && (
                <IconButton component={RouterLink} to="/" aria-label="Back to home" size="small" edge="start">
                  <ArrowBackIosNewIcon fontSize="small" />
                </IconButton>
              )}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
              <Button
                component={RouterLink}
                to="/"
                startIcon={<HomeOutlinedIcon />}
                color={isHome ? "primary" : "inherit"}
                variant={isHome ? "contained" : "text"}
                sx={{ mr: 1 }}
              >
                Home
              </Button>

              <NavButton
                to="/individual"
                label="Individual"
                icon={<SelfImprovementOutlinedIcon />}
                activeMatch={(p) => p.startsWith("/individual")}
                requiresAuth
              />
              <NavButton
                to="/network"
                label="Network"
                icon={<PeopleAltOutlinedIcon />}
                activeMatch={(p) => p.startsWith("/network")}
                requiresAuth
              />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 56, justifyContent: "flex-end" }}>
              {!ready ? null : user ? (
                <>
                  {/* 🔔 Notifications bell */}
                  <NotificationsBell />

                  <Tooltip title={user.name ?? user.username ?? user.email}>
                    <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" sx={{ ml: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>{initial}</Avatar>
                    </IconButton>
                  </Tooltip>
                  <Menu
                    anchorEl={anchorEl}
                    open={menuOpen}
                    onClose={() => setAnchorEl(null)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    PaperProps={{
                      elevation: 6,
                      sx: {
                        mt: 1,
                        minWidth: 280,
                        borderRadius: 2,
                        overflow: "hidden",
                        p: 0,
                      },
                    }}
                  >
                    {/* Header: avatar circle + name + email */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5 }}>
                      <Avatar sx={{ width: 40, height: 40 }}>
                        {initial}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                          {user.name ?? user.username ?? "—"}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                          title={user.email ?? ""}
                          sx={{ maxWidth: 180 }}
                        >
                          {user.email ?? ""}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Settings (Manage Account) */}
                    <MenuItem onClick={handleManageAccount}>
                      <Typography variant="body2">Settings</Typography>
                    </MenuItem>
                    <Divider />

                    {/* Logout */}
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Button
                        fullWidth
                        onClick={handleLogout}
                        variant="contained"
                        disableElevation
                        sx={{
                          textTransform: "none",
                          fontWeight: 700,
                          borderRadius: 2,
                          bgcolor: "action.hover",
                          color: "text.primary",
                          boxShadow: "none",
                          "&:hover": {
                            bgcolor: "action.selected",
                            boxShadow: "none",
                          },
                          "&:active": { boxShadow: "none" },
                        }}
                      >
                        Log out
                      </Button>
                    </Box>

                    <Divider />

                    {/* Version */}
                    <Box sx={{ px: 2, py: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        v.{APP_VERSION}
                      </Typography>
                    </Box>
                  </Menu>
                </>
              ) : (
                <>
                  <Button component={RouterLink} to="/login" variant="outlined" size="small">
                    Login
                  </Button>
                  <Button component={RouterLink} to="/register" variant="contained" size="small">
                    Register
                  </Button>
                </>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        <Container sx={{ py: 3 }}>
          <Outlet />
        </Container>
      </Box>

      {user && <FloatingPetWidget />}
    </PetProvider>
  );
}