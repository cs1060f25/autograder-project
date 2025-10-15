"use client";

import * as React from "react";
import {
  Select as MuiSelect,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  SelectProps as MuiSelectProps,
  FormControlProps,
  InputLabelProps,
  MenuItemProps,
} from "@mui/material";

interface SelectProps extends Omit<MuiSelectProps, "onChange"> {
  onValueChange?: (value: string) => void;
}

function Select({ onValueChange, children, ...props }: SelectProps) {
  const handleChange = (event: any) => {
    onValueChange?.(event.target.value as string);
  };

  return (
    <MuiSelect {...props} onChange={handleChange}>
      {children}
    </MuiSelect>
  );
}

interface SelectContentProps extends FormControlProps {}

function SelectContent({ children, ...props }: SelectContentProps) {
  return <FormControl {...props}>{children}</FormControl>;
}

interface SelectGroupProps extends React.ComponentProps<"div"> {}

function SelectGroup({ children, ...props }: SelectGroupProps) {
  return <div {...props}>{children}</div>;
}

interface SelectValueProps extends React.ComponentProps<"span"> {}

function SelectValue({ ...props }: SelectValueProps) {
  return <span {...props} />;
}

interface SelectTriggerProps extends React.ComponentProps<"div"> {
  size?: "sm" | "default";
}

function SelectTrigger({
  size = "default",
  children,
  ...props
}: SelectTriggerProps) {
  return <div {...props}>{children}</div>;
}

interface SelectLabelProps extends InputLabelProps {}

function SelectLabel({ ...props }: SelectLabelProps) {
  return <InputLabel {...props} />;
}

interface SelectItemProps extends MenuItemProps {}

function SelectItem({ children, ...props }: SelectItemProps) {
  return <MenuItem {...props}>{children}</MenuItem>;
}

interface SelectSeparatorProps extends React.ComponentProps<"div"> {}

function SelectSeparator({ ...props }: SelectSeparatorProps) {
  return <div {...props} />;
}

interface SelectScrollUpButtonProps extends React.ComponentProps<"div"> {}

function SelectScrollUpButton({ ...props }: SelectScrollUpButtonProps) {
  return <div {...props} />;
}

interface SelectScrollDownButtonProps extends React.ComponentProps<"div"> {}

function SelectScrollDownButton({ ...props }: SelectScrollDownButtonProps) {
  return <div {...props} />;
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
