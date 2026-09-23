import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  UserCheck,
  Package,
  Bot,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">Page not found</p>
      <p className="mt-1 text-sm text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Go home
      </Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
      <h1 className="text-2xl font-bold">This page didn't load</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Something went wrong on our end. You can try refreshing or head back home.
      </p>
      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try again
        </button>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster />
        <Scripts />
      </body>
    </html>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 sm:px-8">
        <Link to="/" className="font-bold text-lg flex items-center gap-2 whitespace-nowrap">
          ⚽ Fútbol Manager
        </Link>
        {/* Navegación Desktop */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <Link
            to="/"
            className="px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground whitespace-nowrap"
            activeProps={{ className: "bg-accent text-foreground font-semibold" }}
          >
            Panel
          </Link>

          <Link
            to="/convocados-local"
            className="px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground whitespace-nowrap"
            activeProps={{ className: "bg-accent text-foreground font-semibold" }}
          >
            Conv. Local
          </Link>

          <Link
            to="/convocados-sheet"
            className="px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground whitespace-nowrap"
            activeProps={{ className: "bg-accent text-foreground font-semibold" }}
          >
            Conv. Sheet
          </Link>

          <Link
            to="/armado"
            className="px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground whitespace-nowrap"
            activeProps={{ className: "bg-accent text-foreground font-semibold" }}
          >
            Equipos
          </Link>

          <Link
            to="/plantel"
            className="px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground whitespace-nowrap"
            activeProps={{ className: "bg-accent text-foreground font-semibold" }}
          >
            Plantel
          </Link>

          <Link
            to="/materiales"
            className="px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground whitespace-nowrap"
            activeProps={{ className: "bg-accent text-foreground font-semibold" }}
          >
            Materiales
          </Link>

          <Link
            to="/motor"
            className="px-3 py-2 text-sm rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors border border-green-200 whitespace-nowrap"
            activeProps={{ className: "bg-green-600 text-white font-semibold hover:bg-green-700" }}
          >
            🤖 Motor
          </Link>
        </nav>
      </div>
    </header>
  );
}

function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur border-border px-1 py-1.5 flex items-center justify-around shadow-lg">
      <Link
        to="/"
        className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        activeProps={{ className: "text-primary font-bold" }}
      >
        <LayoutDashboard className="size-4 shrink-0" />
        <span>Panel</span>
      </Link>

      <Link
        to="/convocados-local"
        className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        activeProps={{ className: "text-green-600 font-bold" }}
      >
        <Users className="size-4 shrink-0 text-green-600" />
        <span>Conv. Local</span>
      </Link>

      <Link
        to="/convocados-sheet"
        className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        activeProps={{ className: "text-emerald-600 font-bold" }}
      >
        <FileText className="size-4 shrink-0 text-emerald-600" />
        <span>Conv. Sheet</span>
      </Link>

      <Link
        to="/armado"
        className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        activeProps={{ className: "text-primary font-bold" }}
      >
        <Shield className="size-4 shrink-0" />
        <span>Equipos</span>
      </Link>

      <Link
        to="/plantel"
        className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        activeProps={{ className: "text-primary font-bold" }}
      >
        <UserCheck className="size-4 shrink-0" />
        <span>Plantel</span>
      </Link>

      <Link
        to="/materiales"
        className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        activeProps={{ className: "text-primary font-bold" }}
      >
        <Package className="size-4 shrink-0" />
        <span>Materiales</span>
      </Link>

      <Link
        to="/motor"
        className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        activeProps={{ className: "text-green-600 font-bold" }}
      >
        <Bot className="size-4 shrink-0 text-green-600" />
        <span>Motor</span>
      </Link>
    </nav>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative flex min-h-screen flex-col pb-16 md:pb-0">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </QueryClientProvider>
  );
}
