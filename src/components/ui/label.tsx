"use client";

import * as React from "react";
import { FormLabel, FormLabelProps } from "@mui/material";

interface LabelProps extends FormLabelProps {}

function Label({ sx, ...props }: LabelProps) {
  return (
    <FormLabel
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        fontSize: "0.875rem",
        lineHeight: 1,
        fontWeight: 500,
        userSelect: "none",
        ...sx,
      }}
      {...props}
    />
  );
}

export { Label };
