
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#5868f3" },
    success: { main: "#15b374" },
    warning: { main: "#efb036" },
    error:   { main: "#e45858" },
    background: { default: "#fafafc" },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: "Inter, Roboto, system-ui, -apple-system, Segoe UI, Arial, sans-serif",
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: "0 10px 24px rgba(21,30,70,.06)" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: "none", fontWeight: 600 } },
    },
  },
});
