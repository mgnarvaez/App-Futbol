import { createFileRoute } from "@tanstack/react-router";
import { Loader2, RefreshCw, Shuffle, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { armadorService } from "@/lib/services/armadorService";
import { useAppStore } from "@/lib/store";
import { SEDES, SEDE_LABELS, type Sede } from "@/lib/types";

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

  useEffect(() => {
    void cargarConvocatoriaDelDia();
  }, [cargarConvocatoriaDelDia]);

  const armarLocal = async () => {
    if (!convocatoriaActual) {
      toast.error("No hay una convocatoria activa para armar.");
      return;
    }
    setArmando(true);
    try {
      const resultado = await armadorService.armarEquipos(convocatoriaActual.id);
      toast.success(
        `Convocados locales armados · ${resultado.noAsignados.length} jugador(es) en lista de espera`,
      );
      await cargarConvocatoriaDelDia();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al armar convocados localmente",
      );
    } finally {
      setArmando(false);
    }
  };

  // Filtrar inscripciones convocadas por sede
  const porSede = (sede: Sede) =>
    inscripciones.filter((i) => i.sede === sede && i.estado === "CONVOCADO");

  const noAsignados = inscripciones.filter((i) => i.estado === "NO_ASIGNADO");

  return (
    <AppShell
      title="Convocados Local"
      description="Reparto de convocados y suplentes ejecutado por el motor local de la aplicación."
    >
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" /> Motor Local de Convocatoria
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Ejecutá el algoritmo local para distribuir titulares y suplentes por sede.
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
                  <Loader2 className="mr-2 size-4 animate-spin" /> Armando...
                </>
              ) : (
                <>
                  <Shuffle className="mr-2 size-4" /> Armar convocados
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
                      No hay titulares asignados en esta sede. Presioná &quot;Armar convocados&quot;.
                    </p>
                  ) : (
                    <div className="divide-y divide-border">
                      {convocadosSede.map((i, idx) => (
                        <div
                          key={i.id}
                          className="flex items-center justify-between py-1.5 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-muted-foreground w-4 text-right">
                              {idx + 1}.
                            </span>
                            <span className="font-medium text-foreground">
                              {i.jugador?.apodo || i.jugador?.nombre || "Jugador"}
                            </span>
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
                {noAsignados.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between bg-white p-2 rounded border border-amber-200 text-xs"
                  >
                    <span className="font-medium">
                      {i.jugador?.apodo || i.jugador?.nombre}
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
