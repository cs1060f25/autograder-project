import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
} from "@mui/icons-material";

export function MarketingPanel() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: "2.5rem", lg: "3rem" },
            fontWeight: "bold",
            color: "text.primary",
            lineHeight: 1.2,
          }}
        >
          <Box
            component="span"
            sx={{
              background: "linear-gradient(45deg, #9333ea, #e11d48, #ea580c)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            AI-Assisted
          </Box>
          <Box
            component="span"
            sx={{ display: "block", color: "text.primary" }}
          >
            Grading Platform
          </Box>
        </Typography>
        <Typography
          variant="h5"
          sx={{
            color: "text.secondary",
            lineHeight: 1.6,
            fontWeight: 400,
          }}
        >
          Transform your grading process with intelligent automation that saves
          time while maintaining accuracy and fairness.
        </Typography>
      </Box>

      <List sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <ListItem sx={{ alignItems: "flex-start", px: 0 }}>
          <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "primary.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 20, color: "primary.main" }} />
            </Box>
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "text.primary" }}
              >
                Intelligent Assessment
              </Typography>
            }
            secondary={
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5 }}
              >
                Advanced AI algorithms analyze student work with human-level
                understanding and consistency, greatly accelerating the human
                grading process.
              </Typography>
            }
          />
        </ListItem>

        <ListItem sx={{ alignItems: "flex-start", px: 0 }}>
          <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "success.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SpeedIcon sx={{ fontSize: 20, color: "success.main" }} />
            </Box>
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "text.primary" }}
              >
                Instant Feedback
              </Typography>
            }
            secondary={
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5 }}
              >
                Provide immediate, detailed feedback to students, accelerating
                their learning process.
              </Typography>
            }
          />
        </ListItem>

        <ListItem sx={{ alignItems: "flex-start", px: 0 }}>
          <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "warning.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SecurityIcon sx={{ fontSize: 20, color: "warning.main" }} />
            </Box>
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "text.primary" }}
              >
                Secure & Reliable
              </Typography>
            }
            secondary={
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5 }}
              >
                Encryption ensures that sensitive student data is protected at
                all times.
              </Typography>
            }
          />
        </ListItem>
      </List>

      <Box sx={{ pt: 2 }}>
        <Typography variant="body2" sx={{ color: "text.disabled" }}>
          Created by Evan Jiang, Andrew Zhao, and Jackson Moody
        </Typography>
      </Box>
    </Box>
  );
}
