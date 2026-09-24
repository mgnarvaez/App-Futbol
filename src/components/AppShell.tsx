import React, { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
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
import { Button } from "@/components/ui/button";

interface AppShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function AppShell({ title, description, children }: AppShellProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Detectar si el modo oscuro está activo en el html
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* BARRA DE ACCESOS DIRECTOS Y MODO OSCURO */}
      <div className="border-b bg-card/50 backdrop-blur sticky top-0 sm:top-14 z-40 px-3 py-2 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Accesos directos a solapas con scroll horizontal en celular */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto flex-1 py-0.5 min-w-0">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-accent text-muted-foreground transition-colors shrink-0"
              activeProps={{ className: "bg-accent text-foreground font-semibold" }}
            >
              <LayoutDashboard className="size-4 shrink-0" />
              <span>Panel</span>
            </Link>

            <Link
              to="/convocados-local"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-accent text-muted-foreground transition-colors shrink-0"
              activeProps={{ className: "bg-accent text-foreground font-semibold" }}
            >
              <Users className="size-4 shrink-0 text-green-600" />
              <span className="hidden sm:inline">Convocados Local</span>
              <span className="sm:hidden">Local</span>
            </Link>

            <Link
              to="/convocados-sheet"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-accent text-muted-foreground transition-colors shrink-0"
              activeProps={{ className: "bg-accent text-foreground font-semibold" }}
            >
              <FileText className="size-4 shrink-0 text-emerald-600" />
              <span className="hidden sm:inline">Convocados Sheet</span>
              <span className="sm:hidden">Sheet</span>
            </Link>

            <Link
              to="/armado"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-accent text-muted-foreground transition-colors shrink-0"
              activeProps={{ className: "bg-accent text-foreground font-semibold" }}
            >
              <Shield className="size-4 shrink-0" />
              <span>Equipos</span>
            </Link>

            <Link
              to="/plantel"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-accent text-muted-foreground transition-colors shrink-0"
              activeProps={{ className: "bg-accent text-foreground font-semibold" }}
            >
              <UserCheck className="size-4 shrink-0" />
              <span>Plantel</span>
            </Link>

            <Link
              to="/materiales"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-accent text-muted-foreground transition-colors shrink-0"
              activeProps={{ className: "bg-accent text-foreground font-semibold" }}
            >
              <Package className="size-4 shrink-0" />
              <span>Materiales</span>
            </Link>

            <Link
              to="/motor"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-accent text-muted-foreground transition-colors shrink-0"
              activeProps={{ className: "bg-accent text-foreground font-semibold" }}
            >
              <Bot className="size-4 shrink-0 text-green-600" />
              <span>Motor</span>
            </Link>
          </div>

          {/* Botón de Modo Oscuro FIJO Y SIEMPRE VISIBLE A LA DERECHA */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="size-8 rounded-full shrink-0 border border-border bg-background/80 shadow-sm ml-1"
          >
            {isDark ? (
              <Sun className="size-4 text-amber-400" />
            ) : (
              <Moon className="size-4 text-slate-700" />
            )}
          </Button>
        </div>
      </div>

      {/* CABECERA DE PÁGINA (TITULO Y DESCRIPCIÓN) */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>

        {/* CONTENIDO DE LA PÁGINA */}
        {children}
      </main>
    </div>
  );
}
