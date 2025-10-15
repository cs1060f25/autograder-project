import * as React from "react";
import { TextField, TextFieldProps } from "@mui/material";

interface InputProps extends Omit<TextFieldProps, "variant"> {
  variant?: "default";
}

function Input({ variant = "default", sx, ...props }: InputProps) {
  return (
    <TextField
      variant="outlined"
      size="small"
      sx={{
        "& .MuiOutlinedInput-root": {
          height: 36,
        },
        ...sx,
      }}
      {...props}
    />
  );
}

export { Input };
