import { ReactNode } from "react";

type AuthLayoutProps = {
  panel: ReactNode;
  children: ReactNode;
};

export function AuthLayout({ panel, children }: AuthLayoutProps) {
  return (
    <div className="min-h-svh bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-4rem)]">
          <div className="hidden lg:block">{panel}</div>
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-sm">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
