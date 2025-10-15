import * as React from "react";
import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  CardHeader as MuiCardHeader,
  CardActions as MuiCardActions,
  Typography,
  Box,
} from "@mui/material";

interface CardProps extends React.ComponentProps<typeof MuiCard> {}

function Card({ sx, ...props }: CardProps) {
  return (
    <MuiCard
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        ...sx,
      }}
      {...props}
    />
  );
}

interface CardHeaderProps extends React.ComponentProps<typeof MuiCardHeader> {}

function CardHeader({ sx, ...props }: CardHeaderProps) {
  return (
    <MuiCardHeader
      sx={{
        ...sx,
      }}
      {...props}
    />
  );
}

interface CardTitleProps extends React.ComponentProps<typeof Typography> {}

function CardTitle({ sx, ...props }: CardTitleProps) {
  return <Typography variant="h6" {...props} />;
}

interface CardDescriptionProps
  extends React.ComponentProps<typeof Typography> {}

function CardDescription({ sx, ...props }: CardDescriptionProps) {
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

interface CardActionProps extends React.ComponentProps<typeof Box> {}

function CardAction({ sx, ...props }: CardActionProps) {
  return (
    <Box
      sx={{
        gridColumn: "2",
        gridRow: "1 / -1",
        alignSelf: "start",
        justifySelf: "end",
        ...sx,
      }}
      {...props}
    />
  );
}

interface CardContentProps
  extends React.ComponentProps<typeof MuiCardContent> {}

function CardContent({ sx, ...props }: CardContentProps) {
  return (
    <MuiCardContent
      sx={{
        ...sx,
      }}
      {...props}
    />
  );
}

interface CardFooterProps extends React.ComponentProps<typeof MuiCardActions> {}

function CardFooter({ sx, ...props }: CardFooterProps) {
  return (
    <MuiCardActions
      sx={{
        display: "flex",
        alignItems: "center",
        ...sx,
      }}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
