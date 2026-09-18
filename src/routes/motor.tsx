import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { APPS_SCRIPT_INSCRIPTOS_URL, obtenerInscriptosSheet } from "@/lib/sheets.functions";
import { correrMotorConvocados, type EngineConfig } from '@/squadEngine';

export const Route = createFileRoute('/motor')({
  component: MotorNativoPage,
});

function MotorNativoPage() {
  const [loading, setLoading] = useState(false);
  const [resultadoMotor, setResultadoMotor] = useState<any>(null);
  const [datosSolapasScript, setDatosSolapasScript] = useState<any>(null);
  const [reporte, setReporte] = useState<string[]>([]);

  const ejecutarComparativa = async () => {
    setLoading(true);
    try {
      const res = await fetch(APPS_SCRIPT_INSCRIPTOS_URL);
      const dataRaw = await res.json();
      const solapas = dataRaw?.solapas || dataRaw || {};
      setDatosSolapasScript(solapas);

      const inscriptos = await obtenerInscriptosSheet();
      const config: EngineConfig = {
        suspensionLluvia: "SOL",
        suspensionOtra1: "NINGUNA",
        suspensionOtra2: "NINGUNA",
        puertos10vs10: false,
        bajasManuales: [],
        pagosManuales: {},
      };

      const sedesNativas = correrMotorConvocados(inscriptos, config);
      setResultadoMotor(sedesNativas);

      setReporte([`✅ ¡Comparativa generada con éxito!`]);
    } catch (error) {
      console.error(error);
      setReporte(["❌ Ocurrió un error al conectar con las solapas de la Sheet."]);
    } finally {
      setLoading(false);
    }
  };

  // Función robusta para extraer los jugadores de la solapa sin importar cómo los devuelva el Apps Script
  const obtenerJugadoresDeSolapa = (nombreSolapa: string) => {
    if (!datosSolapasScript) return [];

    // Buscamos la solapa probando varias combinaciones de nombres de clave
    const solapa = 
      datosSolapasScript[nombreSolapa] || 
      datosSolapasScript[nombreSolapa.toLowerCase()] || 
      datosSolapasScript[nombreSolapa.replace(/\s+/g, "_")] ||
      Object.keys(datosSolapasScript).find(k => k.toLowerCase().includes(nombreSolapa.toLowerCase())) ? 
      datosSolapasScript[Object.keys(datosSolapasScript).find(k => k.toLowerCase().includes(nombreSolapa.toLowerCase()))!] : null;

    if (!solapa) return [];

    // Si es un arreglo directo de filas o jugadores
    const lista = solapa.players || solapa.convocados || solapa.values || (Array.isArray(solapa) ? solapa : []);
    
    return lista.map((item: any) => {
      if (typeof item === 'string') return { nombre: item };
      return {
        nombre: item.nombre || item.apodo || item.rawNombre || item[0] || item.email || "Jugador sin nombre"
      };
    }).filter((j: any) => j.nombre && j.nombre !== "Jugador sin nombre");
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 pb-20 text-foreground">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">🤖 Comparativa: Motor Local vs Script de Google</h1>
          <p className="text-sm text-muted-foreground">Contrasta los equipos calculados en la app frente a las solapas oficiales de turnos.</p>
        </div>
        <button
          onClick={ejecutarComparativa}
          disabled={loading}
          className="w-full sm:w-auto px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-sm transition-colors text-center"
        >
          {loading ? "Analizando..." : "⚖️ Ejecutar Comparativa"}
        </button>
      </div>

      {reporte.length > 0 && (
        <div className="p-4 bg-muted/60 border border-border rounded-lg">
          {reporte.map((r, i) => (
            <p key={i} className="text-foreground font-medium text-sm sm:text-base">{r}</p>
          ))}
        </div>
      )}

      {/* BLOQUE DE COMPARATIVA POR SEDE Y TURNO */}
      {resultadoMotor && datosSolapasScript && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold border-b border-border pb-2">
            🏟️ Enfrentamiento Directo por Sede
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* --- CANTON --- */}
            <div className="space-y-4">
              <div className="bg-primary/10 p-3 rounded-lg border border-border text-center">
                <h3 className="font-bold text-primary">CANTON (20 hs)</h3>
              </div>

              {/* Lado Motor Local */}
              <div className="border border-border bg-card p-4 rounded-xl shadow-sm space-y-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">🤖 Motor Local (App)</span>
                <ul className="text-sm space-y-1">
                  {resultadoMotor["CANTON"]?.conv?.length > 0 ? (
                    resultadoMotor["CANTON"].conv.map((j: any, i: number) => (
                      <li key={i} className="py-1 border-b border-border/50 flex justify-between">
                        <span>{i + 1}. {j.nombre}</span>
                        {j.esVip && <span>⭐</span>}
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Sin jugadores asignados</p>
                  )}
                </ul>
              </div>

              {/* Lado Script Google */}
              <div className="border border-border bg-card/60 p-4 rounded-xl shadow-sm space-y-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">📊 Solapa Script ("20 hs CANTON")</span>
                <ul className="text-sm space-y-1">
                  {obtenerJugadoresDeSolapa("20 hs CANTON").length > 0 ? (
                    obtenerJugadoresDeSolapa("20 hs CANTON").map((j: any, i: number) => (
                      <li key={i} className="py-1 border-b border-border/50 flex justify-between">
                        <span>{i + 1}. {j.nombre}</span>
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No se encontraron datos en la solapa</p>
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
                        {j.esVip && <span>⭐</span>}
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Sin jugadores asignados</p>
                  )}
                </ul>
              </div>

              <div className="border border-border bg-card/60 p-4 rounded-xl shadow-sm space-y-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">📊 Solapa Script ("20:00 hs SM")</span>
                <ul className="text-sm space-y-1">
                  {obtenerJugadoresDeSolapa("20:00 hs SM").length > 0 ? (
                    obtenerJugadoresDeSolapa("20:00 hs SM").map((j: any, i: number) => (
                      <li key={i} className="py-1 border-b border-border/50 flex justify-between">
                        <span>{i + 1}. {j.nombre}</span>
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No se encontraron datos en la solapa</p>
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
                        {j.esVip && <span>⭐</span>}
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Sin jugadores asignados</p>
                  )}
                </ul>
              </div>

              <div className="border border-border bg-card/60 p-4 rounded-xl shadow-sm space-y-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">📊 Solapa Script ("21:15 hs PUERTOS")</span>
                <ul className="text-sm space-y-1">
                  {obtenerJugadoresDeSolapa("21:15 hs PUERTOS").length > 0 ? (
                    obtenerJugadoresDeSolapa("21:15 hs PUERTOS").map((j: any, i: number) => (
                      <li key={i} className="py-1 border-b border-border/50 flex justify-between">
                        <span>{i + 1}. {j.nombre}</span>
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No se encontraron datos en la solapa</p>
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
