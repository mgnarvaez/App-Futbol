import React from "react";

interface AppShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function AppShell({ title, description, children }: AppShellProps) {
  return (
    <div className="space-y-4">
      <div className="border-b pb-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
