import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CloudRain, ExternalLink, Loader2, RefreshCw, Shuffle, UserMinus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { armadorService } from "@/lib/services/armadorService";
import { convocatoriaService } from "@/lib/services/convocatoriaService";
import {
  FORM_URL,
  sincronizacionService,
} from "@/lib/services/sincronizacionService";
import {
  obtenerInscriptosSheet,
  obtenerPlantelSheet,
  registrarBajaSheet,
} from "@/lib/sheets.functions";
import { useAppStore } from "@/lib/store";
import {
  SEDES,
  SEDE_LABELS,
  type EstadoPago,
  type Inscripcion,
  type Sede,
} from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Panel de convocatorias de fútbol" },
      {
        name: "description",
        content:
          "Panel del día: inscripción automática por Google Form, suspensión por lluvia, armado de convocados y control de pagos.",
      },
      { property: "og:title", content: "Panel de convocatorias de fútbol" },
      {
        property: "og:description",
        content:
          "Inscripción automática desde el formulario, suspensión de sedes y armado de convocados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Panel,
});

function Panel() {
  const {
    convocatoriaActual,
    inscripciones,
    cargando,
    cargarConvocatoriaDelDia,
    crearConvocatoria,
    abrirConvocatoria,
    cargarJugadores,
    actualizarEstadoPago,
  } = useAppStore();

  const [armando, setArmando] = useState(false);
  const [bajando, setBajando] = useState<string | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const preparando = useRef(false);

  const { data: inscriptosSheet, refetch: refetchSheet } = useQuery({
    queryKey: ["inscriptos-sheet"],
    queryFn: () => obtenerInscriptosSheet(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    void cargarConvocatoriaDelDia();
    void cargarJugadores();
  }, [cargarConvocatoriaDelDia, cargarJugadores]);

  const hoy = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (cargando || preparando.current) return;
    if (!convocatoriaActual) {
      preparando.current = true;
      void crearConvocatoria(hoy).finally(() => {
        preparando.current = false;
      });
      return;
    }
    if (convocatoriaActual.estado === "PLANIFICADA") {
      preparando.current = true;
      void abrirConvocatoria().finally(() => {
        preparando.current = false;
      });
    }
  }, [cargando, convocatoriaActual, crearConvocatoria, abrirConvocatoria, hoy]);

  const lluvia = convocatoriaActual?.suspension_lluvia ?? false;
  const canceladas = convocatoriaActual?.sedes_canceladas ?? [];

  const toggleSede = async (sede: Sede, cancelada: boolean) => {
    if (!convocatoriaActual) return;
    const nuevas = cancelada
      ? [...canceladas, sede]
      : canceladas.filter((s) => s !== sede);
    try {
      await convocatoriaService.actualizarSuspensiones(
        convocatoriaActual.id,
        lluvia,
        nuevas,
      );
      await cargarConvocatoriaDelDia();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar sedes");
    }
  };

  const toggleLluvia = async (valor: boolean) => {
    if (!convocatoriaActual) return;
    try {
      await convocatoriaService.actualizarSuspensiones(
        convocatoriaActual.id,
        valor,
        canceladas,
      );
      await cargarConvocatoriaDelDia();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar lluvia");
    }
  };

  const sincronizar = async () => {
    if (!convocatoriaActual) return;
    setSincronizando(true);
    try {
      const { data } = await refetchSheet();
      const filas = data ?? [];
      const resultado = await sincronizacionService.sincronizarInscriptos(
        convocatoriaActual.id,
        filas,
      );
      const plantel = await obtenerPlantelSheet();
      const pagos = await sincronizacionService.sincronizarPagos(plantel);
      toast.success(
        `${resultado.nuevos} inscripto(s) nuevo(s) de ${resultado.total} en la planilla · ${pagos.deben} sin pagar`,
      );
      await cargarConvocatoriaDelDia();
      await cargarJugadores();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al sincronizar inscriptos",
      );
    } finally {
      setSincronizando(false);
    }
  };

  const armar = async () => {
    if (!convocatoriaActual) return;
    setArmando(true);
    try {
      const resultado = await armadorService.armarEquipos(convocatoriaActual.id);
      toast.success(
        `Convocados armados · ${resultado.noAsignados.length} jugador(es) sin asignar`,
      );
      await cargarConvocatoriaDelDia();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al armar convocados");
    } finally {
      setArmando(false);
    }
  };

  const bajar = async (inscripcion: Inscripcion) => {
    const apodo = inscripcion.jugador?.apodo || inscripcion.jugador?.nombre || "Jugador";
    if (!confirm(`¿Confirmás dar de baja a "${apodo}" en la planilla?`)) return;

    setBajando(inscripcion.id);
    try {
      // 1. Dar de baja en el backend local/Supabase
      await convocatoriaService.darDeBaja(inscripcion);

      // 2. Registrar baja en la Sheet (activa F2 en TRUE y escribe en Col E y F a partir de fila 4)
      const resSheet = await registrarBajaSheet(apodo, "Baja registrada desde App Web");
      if (resSheet.ok) {
        toast.success(`Baja de ${apodo} registrada en la planilla.`);
      } else {
        toast.error(`Local ok, pero falló Sheet: ${resSheet.mensaje}`);
      }

      await cargarConvocatoriaDelDia();
      await refetchSheet();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al dar de baja");
    } finally {
      setBajando(null);
    }
  };

  return (
    <AppShell
      title="Panel de control"
      description="La convocatoria del día se abre sola. La inscripción se hace por el Google Form."
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Convocatoria de hoy · {hoy}</CardTitle>
          {convocatoriaActual && (
            <Badge
              variant={
                convocatoriaActual.estado === "ABIERTA"
                  ? "default"
                  : convocatoriaActual.estado === "CANCELADA"
                    ? "destructive"
                    : "secondary"
              }
            >
              {convocatoriaActual.estado}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!convocatoriaActual ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Preparando la convocatoria de hoy…
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <a href={FORM_URL} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 size-4" />
                    Abrir formulario de inscripción
                  </a>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void sincronizar()}
                  disabled={sincronizando}
                >
                  {sincronizando ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 size-4" />
                  )}
                  Traer inscriptos de la planilla
                </Button>
                <Button variant="secondary" onClick={() => void armar()} disabled={armando}>
                  {armando ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Shuffle className="mr-2 size-4" />
                  )}
                  Armar convocados
                </Button>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
                <Label htmlFor="lluvia" className="flex items-center gap-2 font-normal">
                  <CloudRain className="size-4 text-info" />
                  Suspensión por lluvia
                </Label>
                <Switch
                  id="lluvia"
                  checked={lluvia}
                  onCheckedChange={(v) => void toggleLluvia(v)}
                />
              </div>

              <div className="space-y-2 rounded-lg border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Sedes canceladas
                </p>
                {SEDES.map((sede) => (
                  <div key={sede} className="flex items-center justify-between gap-4">
                    <Label htmlFor={`sede-${sede}`} className="font-normal">
                      {SEDE_LABELS[sede]}
                    </Label>
                    <Switch
                      id={`sede-${sede}`}
                      checked={canceladas.includes(sede)}
                      onCheckedChange={(v) => void toggleSede(sede, v)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 1. INSCRIPTOS EN PLANILLA (Formato ultracompacto 1 línea cel) */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base">
            Inscriptos en la planilla ({inscriptosSheet?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 py-2">
          {!inscriptosSheet ? (
            <p className="text-sm text-muted-foreground">Leyendo la planilla…</p>
          ) : inscriptosSheet.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay respuestas en el formulario.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {inscriptosSheet.map((i, idx) => (
                <div
                  key={`${i.email}-${idx}`}
                  className="flex items-center justify-between py-1.5 px-1 text-xs sm:text-sm whitespace-nowrap overflow-hidden"
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <span className="font-medium text-foreground truncate max-w-[130px] sm:max-w-[200px]">
                      {i.apodo || i.email}
                    </span>
                    {i.vip && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] px-1 py-0.2 rounded font-bold">
                        VIP
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-semibold text-primary text-xs">
                      {i.sede ?? (i.turno || "CANTON")}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        i.flexible
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {i.flexible ? "FLEX" : "FIJO"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. ANOTADOS DE HOY (Formato compacto + Botón Dar Baja directo a Sheet) */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base">
            Anotados de hoy ({inscripciones.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 py-2">
          {inscripciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no sincronizaste la planilla.
            </p>
          ) : (
            <div className="space-y-1">
              {inscripciones.map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5 text-xs sm:text-sm whitespace-nowrap"
                >
                  <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-[180px]">
                    {i.jugador?.apodo || i.jugador?.nombre || "Jugador"}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant={
                        i.jugador?.estado_pago === "DEBE" ? "destructive" : "outline"
                      }
                      className="h-6 px-1.5 text-[10px]"
                      onClick={() =>
                        i.jugador &&
                        void actualizarEstadoPago(
                          i.jugador.id,
                          (i.jugador.estado_pago === "DEBE"
                            ? "AL_DÍA"
                            : "DEBE") as EstadoPago,
                        )
                      }
                    >
                      {i.jugador?.estado_pago === "DEBE" ? "Debe" : "Al día"}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[11px] text-destructive hover:bg-destructive/10"
                      disabled={bajando === i.id}
                      onClick={() => void bajar(i)}
                    >
                      {bajando === i.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <UserMinus className="size-3 mr-1" />
                      )}
                      Bajar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
