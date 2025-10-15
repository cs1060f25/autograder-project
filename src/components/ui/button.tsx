import * as React from "react";
import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
  SxProps,
  Theme,
} from "@mui/material";

interface ButtonProps extends Omit<MuiButtonProps, "variant" | "size" | "sx"> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
  sx?: SxProps<Theme>;
}

function Button({
  variant = "default",
  size = "default",
  asChild = false,
  sx,
  ...props
}: ButtonProps) {
  const muiVariant =
    variant === "default"
      ? "contained"
      : variant === "destructive"
      ? "contained"
      : variant === "outline"
      ? "outlined"
      : variant === "secondary"
      ? "contained"
      : variant === "ghost"
      ? "text"
      : variant === "link"
      ? "text"
      : "contained";

  const muiSize = size === "sm" ? "small" : size === "lg" ? "large" : "medium";

  const buttonSx: SxProps<Theme> = {
    ...(variant === "destructive" && {
      backgroundColor: "error.main",
      "&:hover": {
        backgroundColor: "error.dark",
      },
    }),
    ...(variant === "secondary" && {
      backgroundColor: "secondary.main",
      color: "secondary.contrastText",
      "&:hover": {
        backgroundColor: "secondary.dark",
      },
    }),
    ...(variant === "ghost" && {
      backgroundColor: "transparent",
      "&:hover": {
        backgroundColor: "action.hover",
      },
    }),
    ...(variant === "link" && {
      textDecoration: "underline",
      textTransform: "none",
      "&:hover": {
        textDecoration: "underline",
        backgroundColor: "transparent",
      },
    }),
    ...(size === "icon" && {
      minWidth: "auto",
      width: 36,
      height: 36,
      padding: 0,
    }),
    ...sx,
  };

  return (
    <MuiButton variant={muiVariant} size={muiSize} sx={buttonSx} {...props} />
  );
}

export { Button };
