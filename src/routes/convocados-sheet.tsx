import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileSpreadsheet, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ejecutarOrganizarConvocadosSheet,
  obtenerConvocadosOrganizadosSheet,
} from "@/lib/sheets.functions";

export const Route = createFileRoute("/convocados-sheet")({
  head: () => ({
    meta: [
      { title: "Convocados Sheet - Fútbol Manager" },
      {
        name: "description",
        content: "Listado de convocados generado por el script oficial en la planilla de Google Sheets.",
      },
    ],
  }),
  component: ConvocadosSheetPage,
});

function ConvocadosSheetPage() {
  const [convocandoSheet, setConvocandoSheet] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["convocados-sheet-organizados"],
    queryFn: () => obtenerConvocadosOrganizadosSheet(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const convocarSheet = async () => {
    setConvocandoSheet(true);
    try {
      const res = await ejecutarOrganizarConvocadosSheet();
      if (res.ok) {
        toast.success(res.mensaje);
        await refetch();
      } else {
        toast.error(res.mensaje);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al convocar en la planilla",
      );
    } finally {
      setConvocandoSheet(false);
    }
  };

  const canton = data?.canton || [];
  const sm = data?.sm || [];
  const puertos = data?.puertos || [];

  return (
    <AppShell
      title="Convocados Sheet"
      description="Organización oficial leída directamente desde las pestañas de sedes generadas en la planilla de Google."
    >
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Algoritmo Google Apps Script
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Ordena a la planilla poner el gatillo en TRUE y reordenar las pestañas oficiales por sede.
              </p>
            </div>
            <Button
              variant="default"
              onClick={() => void convocarSheet()}
              disabled={convocandoSheet}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {convocandoSheet ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Procesando en Sheet...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 size-4" /> Convocar
                </>
              )}
            </Button>
          </CardHeader>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span>Cargando convocados desde la planilla...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CANTON */}
            <Card>
              <CardHeader className="py-3 px-4 bg-muted/30 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold">20 hs CANTON</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {canton.length} Convocados
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                {canton.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    Sin datos en esta sede. Presioná &quot;Convocar&quot;.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {canton.map((i, idx) => (
                      <div
                        key={`${i.apodo}-${idx}`}
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
                        {i.vip && (
                          <Badge variant="outline" className="text-[9px] border-amber-300 bg-amber-50 text-amber-800">
                            VIP
                          </Badge>
                        )}
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
                    {sm.length} Convocados
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                {sm.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    Sin datos en esta sede. Presioná &quot;Convocar&quot;.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {sm.map((i, idx) => (
                      <div
                        key={`${i.apodo}-${idx}`}
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
                        {i.vip && (
                          <Badge variant="outline" className="text-[9px] border-amber-300 bg-amber-50 text-amber-800">
                            VIP
                          </Badge>
                        )}
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
                    {puertos.length} Convocados
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                {puertos.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    Sin datos en esta sede. Presioná &quot;Convocar&quot;.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {puertos.map((i, idx) => (
                      <div
                        key={`${i.apodo}-${idx}`}
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
                        {i.vip && (
                          <Badge variant="outline" className="text-[9px] border-amber-300 bg-amber-50 text-amber-800">
                            VIP
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
