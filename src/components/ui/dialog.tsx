"use client";

import * as React from "react";
import {
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  IconButton,
  Typography,
  Box,
  DialogProps as MuiDialogProps,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

interface DialogProps extends MuiDialogProps {}

function Dialog({ ...props }: DialogProps) {
  return <MuiDialog {...props} />;
}

interface DialogContentProps
  extends React.ComponentProps<typeof MuiDialogContent> {
  showCloseButton?: boolean;
  allowWide?: boolean;
}

function DialogContent({
  children,
  showCloseButton = true,
  allowWide = false,
  sx,
  ...props
}: DialogContentProps) {
  return (
    <MuiDialogContent
      sx={{
        maxWidth: allowWide ? "none" : { xs: "calc(100% - 2rem)", sm: 560 },
        width: "100%",
        ...sx,
      }}
      {...props}
    >
      {children}
      {showCloseButton && (
        <IconButton
          aria-label="close"
          onClick={() => {
            // This will be handled by the parent Dialog's onClose
            const event = new Event("close");
            document.dispatchEvent(event);
          }}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "grey[500]",
          }}
        >
          <CloseIcon />
        </IconButton>
      )}
    </MuiDialogContent>
  );
}

interface DialogHeaderProps extends React.ComponentProps<typeof Box> {}

function DialogHeader({ sx, ...props }: DialogHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        textAlign: { xs: "center", sm: "left" },
        ...sx,
      }}
      {...props}
    />
  );
}

interface DialogFooterProps
  extends React.ComponentProps<typeof MuiDialogActions> {}

function DialogFooter({ sx, ...props }: DialogFooterProps) {
  return (
    <MuiDialogActions
      sx={{
        display: "flex",
        flexDirection: { xs: "column-reverse", sm: "row" },
        gap: 1,
        justifyContent: { sm: "flex-end" },
        ...sx,
      }}
      {...props}
    />
  );
}

interface DialogTitleProps
  extends React.ComponentProps<typeof MuiDialogTitle> {}

function DialogTitle({ sx, ...props }: DialogTitleProps) {
  return (
    <MuiDialogTitle
      sx={{
        fontSize: "1.125rem",
        lineHeight: 1,
        fontWeight: 600,
        ...sx,
      }}
      {...props}
    />
  );
}

interface DialogDescriptionProps
  extends React.ComponentProps<typeof Typography> {}

function DialogDescription({ sx, ...props }: DialogDescriptionProps) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{
        ...sx,
      }}
      {...props}
    />
  );
}

// These are kept for compatibility but are no-ops in MUI
function DialogTrigger({ children, ...props }: React.ComponentProps<"div">) {
  return <div {...props}>{children}</div>;
}

function DialogClose({ children, ...props }: React.ComponentProps<"div">) {
  return <div {...props}>{children}</div>;
}

function DialogOverlay({ ...props }: React.ComponentProps<"div">) {
  return <div {...props} />;
}

function DialogPortal({ children, ...props }: React.ComponentProps<"div">) {
  return <div {...props}>{children}</div>;
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
