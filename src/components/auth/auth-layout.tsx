import { ReactNode } from "react";
import { Box, Container } from "@mui/material";

type AuthLayoutProps = {
  panel: ReactNode;
  children: ReactNode;
};

export function AuthLayout({ panel, children }: AuthLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)",
      }}
    >
      <Container maxWidth="lg" sx={{ px: 2, py: 4 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
            gap: 6,
            alignItems: "center",
            minHeight: "calc(100vh - 4rem)",
          }}
        >
          <Box sx={{ display: { xs: "none", lg: "block" } }}>{panel}</Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: { xs: "center", lg: "flex-end" },
            }}
          >
            <Box sx={{ width: "100%", maxWidth: 384 }}>{children}</Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
