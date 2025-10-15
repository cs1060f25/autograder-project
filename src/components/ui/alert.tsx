import { Alert as MuiAlert, AlertProps as MuiAlertProps } from "@mui/material";

interface AlertProps extends Omit<MuiAlertProps, "severity" | "variant"> {
  variant?: "default" | "destructive" | "success";
}

export function Alert({
  variant = "default",
  children,
  sx,
  ...props
}: AlertProps) {
  const severity =
    variant === "destructive"
      ? "error"
      : variant === "success"
      ? "success"
      : "info";

  return (
    <MuiAlert
      severity={severity}
      sx={{
        borderRadius: 1,
        padding: 2,
        fontSize: "0.875rem",
        ...sx,
      }}
      {...props}
    >
      {children}
    </MuiAlert>
  );
}
