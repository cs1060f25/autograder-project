import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-actions";
import { Box, Typography, Link } from "@mui/material";

export function LoginForm({ sx, ...props }: React.ComponentProps<typeof Box>) {
  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 3, ...sx }}
      {...props}
    >
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signIn}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box sx={{ display: "grid", gap: 1.5 }}>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@college.harvard.edu"
                  required
                />
              </Box>
              <Box sx={{ display: "grid", gap: 1.5 }}>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                />
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Button type="submit" sx={{ width: "100%" }}>
                  Login
                </Button>
              </Box>
            </Box>
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="body2">
                Don&apos;t have an account?{" "}
                <Link href="/signup" sx={{ textDecoration: "underline" }}>
                  Sign up
                </Link>
              </Typography>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
