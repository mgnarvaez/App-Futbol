import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  UserCheck,
  Package,
  Bot,
  Sun,
  Moon,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import appCss from "../styles.css?url";
import "../styles.css";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">Página no encontrada</p>
      <Link
        to="/"
        className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Volver al Panel
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
      <h1 className="text-2xl font-bold">Error al cargar la página</h1>
      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Fútbol Manager - Panel" },
      { name: "description", content: "Gestión de Fútbol y Convocados" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/icon.png" },
    ],
  }),
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
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        {children}
        <Toaster />
        <Scripts />
      </body>
    </html>
  );
}

function Navbar() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto flex h-14 items-center justify-between px-3 sm:px-6">
        <Link to="/" className="font-bold text-base sm:text-lg flex items-center gap-2 whitespace-nowrap">
          ⚽ Fútbol Manager
        </Link>

        {/* Menú Horizontal para PC / Tablet */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <Link
            to="/"
            className="px-3 py-1.5 rounded-md text-sm font-medium hover:bg-accent text-muted-foreground transition-colors"
            activeProps={{ className: "bg-accent text-foreground font-semibold" }}
          >
            Panel
          </Link>

          <Link
            to="/convocados-local"
            className="px-3 py-1.5 rounded-md text-sm font-medium text-green-600 hover:bg-accent transition-colors"
            activeProps={{ className: "bg-accent text-green-700 font-semibold" }}
          >
            Conv. Local
          </Link>

          <Link
            to="/convocados-sheet"
            className="px-3 py-1.5 rounded-md text-sm font-medium text-emerald-600 hover:bg-accent transition-colors"
            activeProps={{ className: "bg-accent text-emerald-700 font-semibold" }}
          >
            Conv. Sheet
          </Link>

          <Link
            to="/armado"
            className="px-3 py-1.5 rounded-md text-sm font-medium hover:bg-accent text-muted-foreground transition-colors"
            activeProps={{ className: "bg-accent text-foreground font-semibold" }}
          >
            Equipos
          </Link>

          <Link
            to="/plantel"
            className="px-3 py-1.5 rounded-md text-sm font-medium hover:bg-accent text-muted-foreground transition-colors"
            activeProps={{ className: "bg-accent text-foreground font-semibold" }}
          >
            Plantel
          </Link>

          <Link
            to="/materiales"
            className="px-3 py-1.5 rounded-md text-sm font-medium hover:bg-accent text-muted-foreground transition-colors"
            activeProps={{ className: "bg-accent text-foreground font-semibold" }}
          >
            Materiales
          </Link>

          <Link
            to="/motor"
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors"
            activeProps={{ className: "bg-green-600 text-white font-semibold" }}
          >
            🤖 Motor
          </Link>
        </nav>

        {/* Botón Modo Oscuro (Sol / Luna) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          title={isDark ? "Modo Claro" : "Modo Oscuro"}
          className="size-8 rounded-full shrink-0"
        >
          {isDark ? (
            <Sun className="size-4 text-amber-400" />
          ) : (
            <Moon className="size-4 text-slate-700" />
          )}
        </Button>
      </div>
    </header>
  );
}

function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur px-1 py-1 flex items-center justify-around shadow-lg">
      <Link
        to="/"
        className="flex flex-col items-center justify-center py-1 px-1 text-muted-foreground hover:text-foreground transition-colors"
        activeProps={{ className: "text-primary font-bold" }}
      >
        <LayoutDashboard className="size-4" />
        <span className="text-[9px] mt-0.5 truncate max-w-[48px]">Panel</span>
      </Link>

      <Link
        to="/convocados-local"
        className="flex flex-col items-center justify-center py-1 px-1 text-muted-foreground hover:text-foreground transition-colors"
        activeProps={{ className: "text-green-600 font-bold" }}
      >
        <Users className="size-4 text-green-600" />
        <span className="text-[9px] mt-0.5 truncate max-w-[48px]">Local</span>
      </Link>

      <Link
        to="/convocados-sheet"
        className="flex flex-col items-center justify-center py-1 px-1 text-muted-foreground hover:text-foreground transition-colors"
        activeProps={{ className: "text-emerald-600 font-bold" }}
      >
        <FileText className="size-4 text-emerald-600" />
        <span className="text-[9px] mt-0.5 truncate max-w-[48px]">Sheet</span>
      </Link>

      <Link
        to="/armado"
        className="flex flex-col items-center justify-center py-1 px-1 text-muted-foreground hover:text-foreground transition-colors"
        activeProps={{ className: "text-primary font-bold" }}
      >
        <Shield className="size-4" />
        <span className="text-[9px] mt-0.5 truncate max-w-[48px]">Equipos</span>
      </Link>

      <Link
        to="/plantel"
        className="flex flex-col items-center justify-center py-1 px-1 text-muted-foreground hover:text-foreground transition-colors"
        activeProps={{ className: "text-primary font-bold" }}
      >
        <UserCheck className="size-4" />
        <span className="text-[9px] mt-0.5 truncate max-w-[48px]">Plantel</span>
      </Link>

      <Link
        to="/materiales"
        className="flex flex-col items-center justify-center py-1 px-1 text-muted-foreground hover:text-foreground transition-colors"
        activeProps={{ className: "text-primary font-bold" }}
      >
        <Package className="size-4" />
        <span className="text-[9px] mt-0.5 truncate max-w-[48px]">Material</span>
      </Link>

      <Link
        to="/motor"
        className="flex flex-col items-center justify-center py-1 px-1 text-muted-foreground hover:text-foreground transition-colors"
        activeProps={{ className: "text-green-600 font-bold" }}
      >
        <Bot className="size-4 text-green-600" />
        <span className="text-[9px] mt-0.5 truncate max-w-[48px]">Motor</span>
      </Link>
    </nav>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative flex min-h-screen flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 pb-16 md:pb-6 p-4 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </QueryClientProvider>
  );
}
