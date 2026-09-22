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
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import {
  LayoutDashboard,
  Shield,
  ClipboardList,
  Users,
  Package,
  Bot,
} from "lucide-react";

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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-3 sm:px-8">
        <div className="flex items-center gap-2 sm:gap-6 w-full justify-between sm:justify-start">
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
      </div>
    </header>
  );
}

function BottomNav() {
  const navItems = [
    { to: "/", label: "Panel", icon: LayoutDashboard },
    { to: "/armado", label: "Equipos", icon: Shield },
    { to: "/equipos", label: "Convocados", icon: ClipboardList },
    { to: "/plantel", label: "Plantel", icon: Users },
    { to: "/materiales", label: "Materiales", icon: Package },
    { to: "/motor", label: "Motor", icon: Bot },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-gray-200 md:hidden shadow-lg">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center flex-1 h-full text-gray-500 hover:text-green-600 transition-colors py-1"
              activeProps={{ className: "text-green-600 font-bold" }}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] leading-tight truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 pb-20 md:pb-6">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </QueryClientProvider>
  );
}
