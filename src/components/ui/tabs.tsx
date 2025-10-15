"use client";

import * as React from "react";
import {
  Tabs as MuiTabs,
  Tab,
  Box,
  TabsProps as MuiTabsProps,
  TabProps as MuiTabProps,
} from "@mui/material";

interface TabsProps extends Omit<MuiTabsProps, "onChange"> {
  onValueChange?: (value: string) => void;
}

function Tabs({ onValueChange, value, sx, ...props }: TabsProps) {
  const handleChange = (event: React.SyntheticEvent, newValue: any) => {
    onValueChange?.(newValue);
  };

  return (
    <MuiTabs
      value={value}
      onChange={handleChange}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        ...sx,
      }}
      {...props}
    />
  );
}

interface TabsListProps extends React.ComponentProps<typeof Box> {}

function TabsList({ children, sx, ...props }: TabsListProps) {
  return (
    <Box
      sx={{
        backgroundColor: "action.hover",
        color: "text.secondary",
        display: "inline-flex",
        height: 36,
        width: "fit-content",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 1,
        padding: 0.375,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}

interface TabsTriggerProps extends MuiTabProps {}

function TabsTrigger({ sx, ...props }: TabsTriggerProps) {
  return (
    <Tab
      sx={{
        height: "calc(100% - 1px)",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        borderRadius: 0.5,
        border: "1px solid transparent",
        paddingX: 2,
        paddingY: 1,
        fontSize: "0.875rem",
        fontWeight: 500,
        whiteSpace: "nowrap",
        textTransform: "none",
        minHeight: "auto",
        "&.Mui-selected": {
          backgroundColor: "background.paper",
          color: "text.primary",
          boxShadow: 1,
        },
        ...sx,
      }}
      {...props}
    />
  );
}

interface TabsContentProps extends React.ComponentProps<typeof Box> {}

function TabsContent({ sx, ...props }: TabsContentProps) {
  return (
    <Box
      sx={{
        flex: 1,
        outline: "none",
        ...sx,
      }}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
