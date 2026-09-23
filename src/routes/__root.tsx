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
import { Toaster } from "@/components/ui/sonner";
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  ShieldAlert, 
  UserCheck, 
  Package, 
  Bot 
} from "lucide-react";
import appCss from "../styles.css?url";
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
        Ir al Panel
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
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
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
      <body className="min-h-screen bg-background font-sans antialiased pb-16 md:pb-0">
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
      <div className="container flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto">
          <Link to="/" className="font-bold text-base sm:text-lg flex items-center gap-2 whitespace-nowrap mr-2">
            ⚽ Fútbol Manager
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1">
            <Link
              to="/"
              className="px-2.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors text-xs sm:text-sm text-gray-700 whitespace-nowrap"
              activeProps={{ className: "bg-gray-100 text-black font-bold" }}
            >
              Panel
            </Link>

            <Link
              to="/convocados-local"
              className="px-2.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors text-xs sm:text-sm text-gray-700 whitespace-nowrap"
              activeProps={{ className: "bg-gray-100 text-black font-bold" }}
            >
              Convocados Local
            </Link>

            <Link
              to="/convocados-sheet"
              className="px-2.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors text-xs sm:text-sm text-gray-700 whitespace-nowrap"
              activeProps={{ className: "bg-gray-100 text-black font-bold" }}
            >
              Convocados Sheet
            </Link>

            <Link
              to="/armado"
              className="px-2.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors text-xs sm:text-sm text-gray-700 whitespace-nowrap"
              activeProps={{ className: "bg-gray-100 text-black font-bold" }}
            >
              Equipos
            </Link>

            <Link
              to="/plantel"
              className="px-2.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors text-xs sm:text-sm text-gray-700 whitespace-nowrap"
              activeProps={{ className: "bg-gray-100 text-black font-bold" }}
            >
              Plantel
            </Link>

            <Link
              to="/materiales"
              className="px-2.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors text-xs sm:text-sm text-gray-700 whitespace-nowrap"
              activeProps={{ className: "bg-gray-100 text-black font-bold" }}
            >
              Materiales
            </Link>

            <Link
              to="/motor"
              className="px-2.5 py-1.5 rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors border border-green-200 ml-1 text-xs sm:text-sm whitespace-nowrap"
              activeProps={{ className: "bg-green-600 text-white font-bold hover:bg-green-700" }}
            >
              🤖 Motor
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex justify-around items-center h-14 px-1">
      <Link
        to="/"
        className="flex flex-col items-center justify-center text-[10px] text-gray-600 px-1 py-1"
        activeProps={{ className: "text-green-600 font-bold" }}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>Panel</span>
      </Link>

      <Link
        to="/convocados-local"
        className="flex flex-col items-center justify-center text-[10px] text-gray-600 px-1 py-1"
        activeProps={{ className: "text-green-600 font-bold" }}
      >
        <Users className="w-5 h-5 mb-0.5" />
        <span>Conv. Local</span>
      </Link>

      <Link
        to="/convocados-sheet"
        className="flex flex-col items-center justify-center text-[10px] text-gray-600 px-1 py-1"
        activeProps={{ className: "text-green-600 font-bold" }}
      >
        <FileSpreadsheet className="w-5 h-5 mb-0.5" />
        <span>Conv. Sheet</span>
      </Link>

      <Link
        to="/armado"
        className="flex flex-col items-center justify-center text-[10px] text-gray-600 px-1 py-1"
        activeProps={{ className: "text-green-600 font-bold" }}
      >
        <ShieldAlert className="w-5 h-5 mb-0.5" />
        <span>Equipos</span>
      </Link>

      <Link
        to="/materiales"
        className="flex flex-col items-center justify-center text-[10px] text-gray-600 px-1 py-1"
        activeProps={{ className: "text-green-600 font-bold" }}
      >
        <Package className="w-5 h-5 mb-0.5" />
        <span>Materiales</span>
      </Link>
    </nav>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 pb-12 md:pb-0">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </QueryClientProvider>
  );
}
