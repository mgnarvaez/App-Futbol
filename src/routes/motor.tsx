import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { APPS_SCRIPT_INSCRIPTOS_URL, obtenerInscriptosSheet, obtenerPlantelSheet } from "@/lib/sheets.functions";
import { correrMotorConvocados, type EngineConfig } from '@/squadEngine';

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
      if (typeof item === 'string') return { nombre: item };
      return {
        nombre: item.nombre || item.apodo || item.rawNombre || item[0] || item.email || "Sin nombre"
      };
    }).filter((j: any) => j.nombre && j.nombre !== "Sin nombre");
  };

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
          className="w-full sm:w-auto px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-sm transition-colors text-center"
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
              <strong>Solapas detectadas:</strong> {clavesDisponibles.join(", ")}
            </p>
          )}
        </div>
      )}

      {resultadoMotor && datosSolapasScript && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold border-b border-border pb-2">
            🏟️ Enfrentamiento Directo por Sede (Filtro de Pagos Activo)
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* --- CANTON --- */}
            <div className="space-y-4">
              <div className="bg-primary/10 p-3 rounded-lg border border-border text-center">
                <h3 className="font-bold text-primary">CANTON (20 hs)</h3>
              </div>

              <div className="border border-border bg-card p-4 rounded-xl shadow-sm space-y-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">🤖 Motor Local (App)</span>
                <ul className="text-sm space-y-1">
                  {resultadoMotor["CANTON"]?.conv?.length > 0 ? (
                    resultadoMotor["CANTON"].conv.map((j: any, i: number) => (
                      <li key={i} className="py-1 border-b border-border/50 flex justify-between">
                        <span>{i + 1}. {j.nombre}</span>
                        <div className="flex gap-1">
                          {j.esVip && <span title="VIP">⭐</span>}
                          {!j.pagoAlDia && <span title="Debe plata" className="text-red-500 font-bold">⚠️ Debe</span>}
                        </div>
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Sin jugadores asignados</p>
                  )}
                </ul>
              </div>

              <div className="border border-border bg-card/60 p-4 rounded-xl shadow-sm space-y-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">📊 Solapa Script ("CANTON")</span>
                <ul className="text-sm space-y-1">
                  {obtenerJugadoresDeSolapa("canton").length > 0 ? (
                    obtenerJugadoresDeSolapa("canton").map((j: any, i: number) => (
                      <li key={i} className="py-1 border-b border-border/50 flex justify-between">
                        <span>{i + 1}. {j.nombre}</span>
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No se encontró solapa de Canton</p>
                  )}
                </ul>
              </div>
            </div>

            {/* --- SAN MARTIN (SM) --- */}
            <div className="space-y-4">
              <div className="bg-primary/10 p-3 rounded-lg border border-border text-center">
                <h3 className="font-bold text-primary">SAN MARTÍN (20:00 hs)</h3>
              </div>

              <div className="border border-border bg-card p-4 rounded-xl shadow-sm space-y-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">🤖 Motor Local (App)</span>
                <ul className="text-sm space-y-1">
                  {resultadoMotor["SM"]?.conv?.length > 0 ? (
                    resultadoMotor["SM"].conv.map((j: any, i: number) => (
                      <li key={i} className="py-1 border-b border-border/50 flex justify-between">
                        <span>{i + 1}. {j.nombre}</span>
                        <div className="flex gap-1">
                          {j.esVip && <span title="VIP">⭐</span>}
                          {!j.pagoAlDia && <span title="Debe plata" className="text-red-500 font-bold">⚠️ Debe</span>}
                        </div>
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Sin jugadores asignados</p>
                  )}
                </ul>
              </div>

              <div className="border border-border bg-card/60 p-4 rounded-xl shadow-sm space-y-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">📊 Solapa Script ("SM")</span>
                <ul className="text-sm space-y-1">
                  {obtenerJugadoresDeSolapa("sm").length > 0 ? (
                    obtenerJugadoresDeSolapa("sm").map((j: any, i: number) => (
                      <li key={i} className="py-1 border-b border-border/50 flex justify-between">
                        <span>{i + 1}. {j.nombre}</span>
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No se encontró solapa de San Martín</p>
                  )}
                </ul>
              </div>
            </div>

            {/* --- PUERTOS --- */}
            <div className="space-y-4">
              <div className="bg-primary/10 p-3 rounded-lg border border-border text-center">
                <h3 className="font-bold text-primary">PUERTOS (21:15 hs)</h3>
              </div>

              <div className="border border-border bg-card p-4 rounded-xl shadow-sm space-y-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">🤖 Motor Local (App)</span>
                <ul className="text-sm space-y-1">
                  {resultadoMotor["PUERTOS"]?.conv?.length > 0 ? (
                    resultadoMotor["PUERTOS"].conv.map((j: any, i: number) => (
                      <li key={i} className="py-1 border-b border-border/50 flex justify-between">
                        <span>{i + 1}. {j.nombre}</span>
                        <div className="flex gap-1">
                          {j.esVip && <span title="VIP">⭐</span>}
                          {!j.pagoAlDia && <span title="Debe plata" className="text-red-500 font-bold">⚠️ Debe</span>}
                        </div>
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Sin jugadores asignados</p>
                  )}
                </ul>
              </div>

              <div className="border border-border bg-card/60 p-4 rounded-xl shadow-sm space-y-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">📊 Solapa Script ("PUERTOS")</span>
                <ul className="text-sm space-y-1">
                  {obtenerJugadoresDeSolapa("puertos").length > 0 ? (
                    obtenerJugadoresDeSolapa("puertos").map((j: any, i: number) => (
                      <li key={i} className="py-1 border-b border-border/50 flex justify-between">
                        <span>{i + 1}. {j.nombre}</span>
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No se encontró solapa de Puertos</p>
                  )}
                </ul>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
