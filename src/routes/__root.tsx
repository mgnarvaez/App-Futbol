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
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">Página no encontrada</p>
      <Link
        to="/"
        className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Ir al inicio
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
      <h1 className="text-2xl font-bold">La página no pudo cargar</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ocurrió un error en el servidor. Podés reintentar o volver al inicio.
      </p>
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
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Ir al inicio
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" },
      { name: "theme-color", content: "#16a34a" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "FútbolApp" },
      { title: "Fútbol Manager - Panel" },
      { name: "description", content: "Gestión de Fútbol y Convocados" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Fútbol Manager" },
      { property: "og:description", content: "Gestión de Fútbol y Convocados" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/icon.png", type: "image/png" },
      { rel: "shortcut icon", href: "/icon.png" },
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
      <body className="min-h-screen bg-background font-sans antialiased">
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
      <div className="container flex h-14 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-2 sm:gap-6">
          <Link to="/" className="font-bold text-lg flex items-center gap-2 whitespace-nowrap">
            ⚽ Fútbol Manager
          </Link>
          <nav className="hidden md:flex items-center gap-1 sm:gap-2 overflow-x-auto">
            <Link
              to="/"
              className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700 whitespace-nowrap"
              activeProps={{ className: "bg-gray-100 text-black font-semibold" }}
            >
              Panel
            </Link>

            <Link
              to="/armado"
              className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700 whitespace-nowrap"
              activeProps={{ className: "bg-gray-100 text-black font-semibold" }}
            >
              Equipos
            </Link>

            <Link
              to="/equipos"
              className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700 whitespace-nowrap"
              activeProps={{ className: "bg-gray-100 text-black font-semibold" }}
            >
              Convocados
            </Link>

            <Link
              to="/plantel"
              className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700 whitespace-nowrap"
              activeProps={{ className: "bg-gray-100 text-black font-semibold" }}
            >
              Plantel
            </Link>

            <Link
              to="/materiales"
              className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700 whitespace-nowrap"
              activeProps={{ className: "bg-gray-100 text-black font-semibold" }}
            >
              Materiales
            </Link>

            <Link
              to="/motor"
              className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors border border-green-200 ml-1 whitespace-nowrap"
              activeProps={{ className: "bg-green-600 text-white font-semibold hover:bg-green-700" }}
            >
              🤖 Motor
            </Link>
          </nav>
        </div>

        {/* Botón de modo oscuro en la barra principal */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          className="size-8 rounded-full shrink-0 border border-border bg-background shadow-sm"
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  );
}
