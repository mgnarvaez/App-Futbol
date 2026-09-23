import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Users, Shuffle, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { SEDES, SEDE_LABELS, type Sede, type Inscripcion } from "@/lib/types";

// Intentar importar squadEngine si existe
let squadEngine: any = null;
try {
  squadEngine = require("@/lib/services/squadEngine").squadEngine;
} catch (e) {
  squadEngine = null;
}

export const Route = createFileRoute("/convocados-local")({
  head: () => ({
    meta: [
      { title: "Convocados Local - Fútbol Manager" },
      {
        name: "description",
        content: "Listado y reparto de convocados calculado localmente por el algoritmo de la aplicación.",
      },
    ],
  }),
  component: ConvocadosLocalPage,
});

function ConvocadosLocalPage() {
  const { convocatoriaActual, inscripciones, cargarConvocatoriaDelDia } = useAppStore();
  const [armando, setArmando] = useState(false);
  const [localInscripciones, setLocalInscripciones] = useState<Inscripcion[]>([]);

  useEffect(() => {
    void cargarConvocatoriaDelDia();
  }, [cargarConvocatoriaDelDia]);

  useEffect(() => {
    setLocalInscripciones(inscripciones);
  }, [inscripciones]);

  // Algoritmo SquadEngine Local de reparto
  const armarLocal = async () => {
    if (!convocatoriaActual) {
      toast.error("No hay una convocatoria activa para armar.");
      return;
    }
    setArmando(true);
    try {
      // 1. Si existe el servicio squadEngine, ejecutarlo
      if (squadEngine && typeof squadEngine.organizarConvocados === "function") {
        await squadEngine.organizarConvocados(convocatoriaActual.id);
        toast.success("Convocatoria procesada mediante squadEngine");
        await cargarConvocatoriaDelDia();
        setArmando(false);
        return;
      }

      // 2. Motor SquadEngine Local Integrado (Garantía de funcionamiento)
      const activas = inscripciones.filter((i) => i.estado !== "BAJA");
      
      // Prioridad: VIPs primero, luego por orden de llegada
      const vips = activas.filter((i) => i.vip);
      const general = activas.filter((i) => !i.vip);
      const ordenados = [...vips, ...general];

      const limitePorSede: Record<Sede, number> = {
        CANTON: 14,
        SM: 14,
        PUERTOS: 14,
      };

      const conteoSede: Record<Sede, number> = {
        CANTON: 0,
        SM: 0,
        PUERTOS: 0,
      };

      const resultado: Inscripcion[] = ordenados.map((item) => {
        const sedePref = (item.sede || item.turno || "CANTON").toUpperCase() as Sede;
        const sedeValida = SEDES.includes(sedePref) ? sedePref : "CANTON";

        // Asignación por preferencia principal
        if (conteoSede[sedeValida] < limitePorSede[sedeValida]) {
          conteoSede[sedeValida] += 1;
          return { ...item, estado: "CONVOCADO", sede: sedeValida };
        }

        // Si es flexible, buscar lugar en otra sede disponible
        if (item.flexible) {
          for (const s of SEDES) {
            if (conteoSede[s] < limitePorSede[s]) {
              conteoSede[s] += 1;
              return { ...item, estado: "CONVOCADO", sede: s };
            }
          }
        }

        // Si no hay cupo
        return { ...item, estado: "NO_ASIGNADO" };
      });

      setLocalInscripciones(resultado);

      const convocadosTotales = resultado.filter((i) => i.estado === "CONVOCADO").length;
      const suplentesTotales = resultado.filter((i) => i.estado === "NO_ASIGNADO").length;

      toast.success(
        
      );
    } catch (error) {
      console.error("Error en motor local:", error);
      toast.error(error instanceof Error ? error.message : "Error al ejecutar el reparto local");
    } finally {
      setArmando(false);
    }
  };

  const porSede = (sede: Sede) =>
    localInscripciones.filter((i) => i.sede === sede && i.estado === "CONVOCADO");

  const noAsignados = localInscripciones.filter((i) => i.estado === "NO_ASIGNADO");

  return (
    <AppShell
      title="Convocados Local (SquadEngine)"
      description="Reparto de titulares y suplentes ejecutado por el motor local de la aplicación."
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/convocados-sheet">📄 Convocados Sheet</Link>
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" /> Motor Local SquadEngine
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Distribuye automáticamente titulares y lista de espera evaluando VIP, flexibilidad y cupos por sede.
              </p>
            </div>
            <Button
              variant="default"
              onClick={() => void armarLocal()}
              disabled={armando}
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              {armando ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Procesando...
                </>
              ) : (
                <>
                  <Shuffle className="mr-2 size-4" /> Armar convocados local
                </>
              )}
            </Button>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SEDES.map((sede) => {
            const convocadosSede = porSede(sede);
            return (
              <Card key={sede}>
                <CardHeader className="py-3 px-4 bg-muted/30 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold">
                      {SEDE_LABELS[sede]}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {convocadosSede.length} Titulares
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  {convocadosSede.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No hay titulares asignados en esta sede. Presioná "Armar convocados local".
                    </p>
                  ) : (
                    <div className="divide-y divide-border">
                      {convocadosSede.map((i, idx) => (
                        <div
                          key={i.id || idx}
                          className="flex items-center justify-between py-1.5 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-muted-foreground w-4 text-right">
                              {idx + 1}.
                            </span>
                            <span className="font-medium text-foreground">
                              {i.jugador?.apodo || i.jugador?.nombre || i.apodo || "Jugador"}
                            </span>
                            {i.vip && (
                              <Badge className="bg-amber-100 text-amber-800 text-[9px] px-1 py-0">
                                VIP
                              </Badge>
                            )}
                          </div>
                          {i.jugador?.estado_pago === "DEBE" && (
                            <Badge variant="destructive" className="text-[9px] px-1">
                              Debe
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* LISTA DE ESPERA / NO ASIGNADOS */}
        {noAsignados.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-bold text-amber-800">
                Lista de Espera / Sin Asignar ({noAsignados.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {noAsignados.map((i, idx) => (
                  <div
                    key={i.id || idx}
                    className="flex items-center justify-between bg-white p-2 rounded border border-amber-200 text-xs"
                  >
                    <span className="font-medium">
                      {i.jugador?.apodo || i.jugador?.nombre || i.apodo || "Jugador"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Suplente</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
