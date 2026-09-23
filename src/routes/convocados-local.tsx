import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, Shuffle, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  obtenerInscriptosSheet,
  type InscriptoSheet,
} from "@/lib/sheets.functions";

export const Route = createFileRoute("/convocados-local")({
  component: ConvocadosLocalPage,
});

interface RepartoLocal {
  canton: InscriptoSheet[];
  sm: InscriptoSheet[];
  puertos: InscriptoSheet[];
  listaEspera: InscriptoSheet[];
}

function calcularRepartoLocal(inscriptos: InscriptoSheet[]): RepartoLocal {
  const canton: InscriptoSheet[] = [];
  const sm: InscriptoSheet[] = [];
  const puertos: InscriptoSheet[] = [];
  const listaEspera: InscriptoSheet[] = [];

  const capCanton = 14;
  const capSM = 16;
  const capPuertos = 14;

  // Prioridad estricta: VIPs primero, luego General (manteniendo orden de timestamp)
  const ordenados = [...inscriptos].sort((a, b) => {
    if (a.vip !== b.vip) return a.vip ? -1 : 1;
    return 0;
  });

  for (const player of ordenados) {
    const prefRaw = (player.turno || player.sede || "").toUpperCase();
    const esCanton = prefRaw.includes("CANTON");
    const esSM = prefRaw.includes("SM") || prefRaw.includes("MATIAS");
    const esPuertos = prefRaw.includes("PUERTOS");

    let asignado = false;

    // 1. Intenta en su sede preferida
    if (esCanton && canton.length < capCanton) {
      canton.push(player);
      asignado = true;
    } else if (esSM && sm.length < capSM) {
      sm.push(player);
      asignado = true;
    } else if (esPuertos && puertos.length < capPuertos) {
      puertos.push(player);
      asignado = true;
    }

    // 2. Si no pudo y es flexible, intenta en otras sedes activas
    if (!asignado && player.flexible) {
      if (canton.length < capCanton) {
        canton.push(player);
        asignado = true;
      } else if (sm.length < capSM) {
        sm.push(player);
        asignado = true;
      } else if (puertos.length < capPuertos) {
        puertos.push(player);
        asignado = true;
      }
    }

    // 3. Si no logró ingresar, va a Lista de Espera
    if (!asignado) {
      listaEspera.push(player);
    }
  }

  return { canton, sm, puertos, listaEspera };
}

function ConvocadosLocalPage() {
  const [calculando, setCalculando] = useState(false);

  const { data: inscriptosSheet, isLoading, refetch } = useQuery({
    queryKey: ["inscriptos-sheet-local"],
    queryFn: () => obtenerInscriptosSheet(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const inscriptos = inscriptosSheet || [];
  const reparto = calcularRepartoLocal(inscriptos);

  const armarLocal = async () => {
    setCalculando(true);
    try {
      await refetch();
      const totalTitulares =
        reparto.canton.length + reparto.sm.length + reparto.puertos.length;
      toast.success(
        `Motor local calculado · ${totalTitulares} titulares convocados, ${reparto.listaEspera.length} en espera.`
      );
    } catch (error) {
      toast.error("Error al consultar inscriptos de la planilla.");
    } finally {
      setCalculando(false);
    }
  };

  return (
    <AppShell
      title="Convocados Local"
      description="Listado y reparto de convocados calculado localmente por el algoritmo de la aplicación."
    >
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" /> Motor Local de Convocatoria
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Lee los inscriptos de las planillas y aplica las reglas locales de cupo, VIP y flexibilidad.
              </p>
            </div>
            <Button
              variant="default"
              onClick={() => void armarLocal()}
              disabled={calculando || isLoading}
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              {calculando || isLoading ? (
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

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            <span>Leyendo inscriptos para el motor local...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* CANTON */}
              <Card>
                <CardHeader className="py-3 px-4 bg-muted/30 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold">20 hs CANTON</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {reparto.canton.length} / 14 Titulares
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  {reparto.canton.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No hay titulares asignados. Presioná &quot;Armar convocados local&quot;.
                    </p>
                  ) : (
                    <div className="divide-y divide-border">
                      {reparto.canton.map((i, idx) => (
                        <div
                          key={`${i.email}-${idx}`}
                          className="flex items-center justify-between py-1.5 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-muted-foreground w-4 text-right">
                              {idx + 1}.
                            </span>
                            <span className="font-medium text-foreground">
                              {i.apodo || i.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {i.vip && (
                              <Badge
                                variant="outline"
                                className="text-[9px] border-amber-300 bg-amber-50 text-amber-800"
                              >
                                VIP
                              </Badge>
                            )}
                            {i.flexible && (
                              <Badge
                                variant="secondary"
                                className="text-[9px] bg-emerald-50 text-emerald-800"
                              >
                                FLEX
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SAN MATIAS */}
              <Card>
                <CardHeader className="py-3 px-4 bg-muted/30 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold">20:00 hs SAN MATÍAS</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {reparto.sm.length} / 16 Titulares
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  {reparto.sm.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No hay titulares asignados. Presioná &quot;Armar convocados local&quot;.
                    </p>
                  ) : (
                    <div className="divide-y divide-border">
                      {reparto.sm.map((i, idx) => (
                        <div
                          key={`${i.email}-${idx}`}
                          className="flex items-center justify-between py-1.5 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-muted-foreground w-4 text-right">
                              {idx + 1}.
                            </span>
                            <span className="font-medium text-foreground">
                              {i.apodo || i.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {i.vip && (
                              <Badge
                                variant="outline"
                                className="text-[9px] border-amber-300 bg-amber-50 text-amber-800"
                              >
                                VIP
                              </Badge>
                            )}
                            {i.flexible && (
                              <Badge
                                variant="secondary"
                                className="text-[9px] bg-emerald-50 text-emerald-800"
                              >
                                FLEX
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* PUERTOS */}
              <Card>
                <CardHeader className="py-3 px-4 bg-muted/30 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold">21:15 hs PUERTOS</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {reparto.puertos.length} / 14 Titulares
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  {reparto.puertos.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No hay titulares asignados. Presioná &quot;Armar convocados local&quot;.
                    </p>
                  ) : (
                    <div className="divide-y divide-border">
                      {reparto.puertos.map((i, idx) => (
                        <div
                          key={`${i.email}-${idx}`}
                          className="flex items-center justify-between py-1.5 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-muted-foreground w-4 text-right">
                              {idx + 1}.
                            </span>
                            <span className="font-medium text-foreground">
                              {i.apodo || i.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {i.vip && (
                              <Badge
                                variant="outline"
                                className="text-[9px] border-amber-300 bg-amber-50 text-amber-800"
                              >
                                VIP
                              </Badge>
                            )}
                            {i.flexible && (
                              <Badge
                                variant="secondary"
                                className="text-[9px] bg-emerald-50 text-emerald-800"
                              >
                                FLEX
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* LISTA DE ESPERA / SUPLENTES */}
            {reparto.listaEspera.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/30">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-bold text-amber-800">
                    Lista de Espera / Sin Asignar ({reparto.listaEspera.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {reparto.listaEspera.map((i, idx) => (
                      <div
                        key={`${i.email}-${idx}`}
                        className="flex items-center justify-between bg-white p-2 rounded border border-amber-200 text-xs"
                      >
                        <span className="font-medium">
                          {i.apodo || i.email}
                        </span>
                        <div className="flex items-center gap-1">
                          {i.vip && (
                            <Badge
                              variant="outline"
                              className="text-[9px] border-amber-300 bg-amber-50 text-amber-800"
                            >
                              VIP
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            Suplente
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
