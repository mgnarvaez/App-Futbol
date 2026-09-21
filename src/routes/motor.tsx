import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { APPS_SCRIPT_INSCRIPTOS_URL, obtenerInscriptosSheet, obtenerPlantelSheet } from "@/lib/sheets.functions";
import { correrMotorConvocados, type EngineConfig } from '@/lib/squadEngine';

export const Route = createFileRoute('/motor')({
  component: MotorNativoPage,
});

function MotorNativoPage() {
  const [loading, setLoading] = useState(false);
  const [resultadoMotor, setResultadoMotor] = useState<any>(null);
  const [datosSolapasScript, setDatosSolapasScript] = useState<any>(null);
  const [clavesDisponibles, setClavesDisponibles] = useState<string[]>([]);
  const [reporte, setReporte] = useState<string[]>([]);

  const ejecutarComparativa = async () => {
    setLoading(true);
    try {
      // 1. Leemos las solapas del script para la comparativa visual
      const res = await fetch(APPS_SCRIPT_INSCRIPTOS_URL);
      const dataRaw = await res.json();
      const solapas = dataRaw?.solapas || dataRaw || {};
      setDatosSolapasScript(solapas);
      setClavesDisponibles(Object.keys(solapas));

      // 2. Obtenemos los inscriptos y el plantel oficial para cruzar los pagos
      const inscriptos = await obtenerInscriptosSheet();
      const plantel = await obtenerPlantelSheet();

      // Mapeamos el estado de pago usando booleanos puros (true = al día, false = debe)
      const pagosManuales: Record<string, boolean> = {};
      
      plantel.forEach((j) => {
        if (j.email) pagosManuales[j.email.toLowerCase().trim()] = j.pago;
        if (j.apodo) pagosManuales[j.apodo.toLowerCase().trim()] = j.pago;
      });

      // 3. Configuramos el motor pasando los pagos como booleanos exactos
      const config: EngineConfig = {
        suspensionLluvia: "SOL",
        suspensionOtra1: "NINGUNA",
        suspensionOtra2: "NINGUNA",
        puertos10vs10: false,
        bajasManuales: [],
        pagosManuales: pagosManuales, 
      };

      const sedesNativas = correrMotorConvocados(inscriptos, config);
      setResultadoMotor(sedesNativas);

      setReporte([`✅ ¡Motor ejecutado con éxito! Se procesaron ${inscriptos.length} inscriptos y ${plantel.length} jugadores en el plantel.`]);
    } catch (error) {
      console.error(error);
      setReporte(["❌ Ocurrió un error al procesar el motor o el plantel."]);
    } finally {
      setLoading(false);
    }
  };

  const obtenerJugadoresDeSolapa = (criterio: string) => {
    if (!datosSolapasScript) return [];
    const claveEncontrada = Object.keys(datosSolapasScript).find(k => 
      k.toLowerCase().includes(criterio.toLowerCase())
    );
    if (!claveEncontrada) return [];

    const solapa = datosSolapasScript[claveEncontrada];
    const lista = solapa.players || solapa.convocados || solapa.values || (Array.isArray(solapa) ? solapa : []);

    return lista.map((item: any) => {
      if (typeof item === 'string') return { nombre: item, estado: 'CONVOCADO' };
      const nombre = item.nombre || item.apodo || item.rawNombre || item[0] || item.email || "Sin nombre";
      const estado = item.estado || "CONVOCADO";
      return { nombre, estado };
    }).filter((j: any) => j.nombre && j.nombre !== "Sin nombre");
  };

  const sedesConfig = [
    { key: "CANTON", label: "CANTON (20 hs)", busqueda: "canton" },
    { key: "SM", label: "SAN MATIAS (20:00 hs)", busqueda: "sm" },
    { key: "PUERTOS", label: "PUERTOS (21:15 hs)", busqueda: "puertos" },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 pb-20 text-foreground">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">🤖 Comparativa: Motor Local vs Script de Google</h1>
          <p className="text-sm text-muted-foreground">Priorizando automáticamente a los jugadores al día con los pagos.</p>
        </div>
        <button
          onClick={ejecutarComparativa}
          disabled={loading}
          className="w-full sm:w-auto px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-sm transition-colors text-center cursor-pointer"
        >
          {loading ? "Calculando..." : "⚖️ Ejecutar Comparativa con Pagos"}
        </button>
      </div>

      {reporte.length > 0 && (
        <div className="p-4 bg-muted/60 border border-border rounded-lg space-y-2">
          {reporte.map((r, i) => (
            <p key={i} className="text-foreground font-medium text-sm sm:text-base">{r}</p>
          ))}
          {clavesDisponibles.length > 0 && (
            <p className="text-xs text-muted-foreground">
              <strong>Solapas detectadas en la Sheet:</strong> {clavesDisponibles.join(", ")}
            </p>
          )}
        </div>
      )}

      {resultadoMotor && datosSolapasScript && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold border-b border-border pb-2">
            🏟️ Enfrentamiento Directo Fila a Fila (Google Sheet vs App Web)
          </h2>

          <div className="space-y-6">
            {sedesConfig.map(({ key, label, busqueda }) => {
              const motorSede = resultadoMotor[key] || { conv: [], supl: [], activa: true, motivo: "" };
              const sheetPlayers = obtenerJugadoresDeSolapa(busqueda);

              const sheetConv = sheetPlayers.filter((p: any) => !p.estado || p.estado.toUpperCase().includes("CONVOCADO"));
              const sheetSupl = sheetPlayers.filter((p: any) => p.estado && p.estado.toUpperCase().includes("SUPLENTE"));

              const maxConv = Math.max(sheetConv.length, motorSede.conv.length);
              const maxSupl = Math.max(sheetSupl.length, motorSede.supl.length);

              return (
                <div key={key} className="border border-border rounded-xl bg-card overflow-hidden shadow-sm space-y-0">
                  {/* Título y Estado de la Sede */}
                  <div className="bg-primary/10 px-4 py-3 border-b border-border flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-primary text-base">{label}</h3>
                      {!motorSede.activa && (
                        <span className="bg-red-500/20 text-red-600 text-xs px-2 py-0.5 rounded font-bold">
                          {motorSede.motivo || "CANCELADA"}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-3 font-semibold">
                      <span>Sheet: {sheetConv.length} convocados</span>
                      <span>•</span>
                      <span>Motor: {motorSede.conv.length} convocados</span>
                    </div>
                  </div>

                  {/* Encabezados de las 2 columnas en paralelo */}
                  <div className="grid grid-cols-2 divide-x divide-border bg-muted/40 text-xs font-bold py-2 px-3 text-center border-b border-border">
                    <div className="text-emerald-700 dark:text-emerald-400">📊 Google Sheet (Script)</div>
                    <div className="text-blue-700 dark:text-blue-400">🤖 Motor Local (App Web)</div>
                  </div>

                  {/* Filas de Titulares alineadas par a par */}
                  <div className="divide-y divide-border/60 text-sm">
                    {maxConv === 0 ? (
                      <p className="p-4 text-xs text-muted-foreground italic text-center">Sin convocados asignados</p>
                    ) : (
                      Array.from({ length: maxConv }).map((_, i) => {
                        const jugSheet = sheetConv[i];
                        const jugMotor = motorSede.conv[i];

                        const nomSheet = jugSheet?.nombre || "";
                        const nomMotor = jugMotor?.nombre || "";

                        const nomSheetClean = nomSheet.toLowerCase().trim();
                        const nomMotorClean = nomMotor.toLowerCase().trim();
                        const esDiferente = nomSheetClean !== nomMotorClean;

                        return (
                          <div 
                            key={i} 
                            className={`grid grid-cols-2 divide-x divide-border/60 py-1.5 px-3 text-xs sm:text-sm items-center transition-colors ${
                              esDiferente ? "bg-amber-500/10 dark:bg-amber-500/20" : ""
                            }`}
                          >
                            {/* Columna Izquierda: Google Sheet */}
                            <div className="pr-2 flex justify-between items-center min-w-0">
                              <span className="truncate">
                                {nomSheet ? `${i + 1}. ${nomSheet}` : <span className="text-muted-foreground italic">-</span>}
                              </span>
                            </div>

                            {/* Columna Derecha: Motor Local */}
                            <div className="pl-2 flex justify-between items-center min-w-0">
                              <span className="truncate font-medium">
                                {nomMotor ? `${i + 1}. ${nomMotor}` : <span className="text-muted-foreground italic">-</span>}
                              </span>
                              
                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                {jugMotor?.esVip && <span title="VIP">⭐</span>}
                                {jugMotor && !jugMotor.pagoAlDia && (
                                  <span title="Debe plata" className="text-red-500 font-bold text-[10px] bg-red-100 dark:bg-red-950 px-1 rounded">
                                    Debe
                                  </span>
                                )}
                                {esDiferente && nomSheet && nomMotor && (
                                  <span title="Difiere de la Sheet" className="text-amber-600 text-xs font-bold">⚠️</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Sección Suplentes en 2 columnas */}
                  {maxSupl > 0 && (
                    <div className="border-t border-border bg-muted/20">
                      <div className="px-3 py-1 bg-red-500/10 text-[11px] font-bold text-red-600 uppercase border-b border-border">
                        Suplentes
                      </div>
                      <div className="divide-y divide-border/40 text-xs">
                        {Array.from({ length: maxSupl }).map((_, i) => {
                          const sSheet = sheetSupl[i];
                          const sMotor = motorSede.supl[i];

                          return (
                            <div key={i} className="grid grid-cols-2 divide-x divide-border/40 py-1 px-3 text-red-600">
                              <div className="truncate pr-2">
                                {sSheet ? `${i + 1}. ${sSheet.nombre}` : "-"}
                              </div>
                              <div className="truncate pl-2 font-medium">
                                {sMotor ? `${i + 1}. ${sMotor.nombre}` : "-"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
