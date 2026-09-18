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
      // 1. Consultamos el Apps Script para traer las solapas de turnos (20 hs CANTON, 20:00 hs SM, 21:15 hs PUERTOS, etc.)
      const res = await fetch(APPS_SCRIPT_INSCRIPTOS_URL);
      const dataRaw = await res.json();
      const solapas = dataRaw?.solapas || {};
      setDatosSolapasScript(solapas);

      // 2. Ejecutamos el motor nativo localmente
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

      setReporte([`✅ ¡Comparativa generada con éxito! Datos cruzados entre el motor local y las solapas del script.`]);
    } catch (error) {
      console.error(error);
      setReporte(["❌ Ocurrió un error al conectar con las solapas de la Sheet."]);
    } finally {
      setLoading(false);
    }
  };

  // Helper para extraer los jugadores de una solapa específica del script
  const obtenerJugadoresDeSolapa = (solapaKey: string) => {
    if (!datosSolapasScript) return [];
    const solapa = datosSolapasScript[solapaKey] || datosSolapasScript[solapaKey.toLowerCase()] || {};
    return solapa.players || solapa.convocados || [];
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 pb-20 text-gray-900 dark:text-gray-100">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">🤖 Comparativa: Motor Local vs Script de Google</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Contrasta los equipos calculados en la app frente a las solapas oficiales de turnos.</p>
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
        <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg">
          {reporte.map((r, i) => (
            <p key={i} className="text-blue-900 dark:text-blue-200 font-medium text-sm sm:text-base">{r}</p>
          ))}
        </div>
      )}

      {/* BLOQUE DE COMPARATIVA POR SEDE Y TURNO */}
      {resultadoMotor && datosSolapasScript && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold border-b border-gray-200 dark:border-gray-800 pb-2">
            🏟️ Enfrentamiento Directo por Sede
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* --- CANTON --- */}
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center">
                <h3 className="font-bold text-emerald-900 dark:text-emerald-200">CANTON (20 hs)</h3>
              </div>

              {/* Lado Motor Local */}
              <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm space-y-2">
                <span className="text-xs font-semibold uppercase text-gray-400">🤖 Motor Local (App)</span>
                <ul className="text-sm space-y-1">
                  {resultadoMotor["CANTON"]?.conv?.length > 0 ? (
                    resultadoMotor["CANTON"].conv.map((j: any, i: number) => (
                      <li key={i} className="py-1 border-b border-gray-50 dark:border-gray-800/50 flex justify-between">
                        <span>{i + 1}. {j.nombre}</span>
                        {j.esVip && <span>⭐</span>}
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">Sin jugadores asignados</p>
                  )}
                </ul>
              </div>

              {/* Lado Script Google */}
              <div className="border border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-gray-900 p-4 rounded-xl shadow-sm space-y-2">
                <span className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">📊 Solapa Script ("20 hs CANTON")</span>
                <ul className="text-sm space-y-1">
                  {obtenerJugadoresDeSolapa("20 hs CANTON").length > 0 ? (
                    obtenerJugadoresDeSolapa("20 hs CANTON").map((j: any, i: number) => (
                      <li key={i} className="py-1 border-b border-blue-100 dark:border-gray-800/50 flex justify-between">
                        <span>{i + 1}. {j.nombre || j.apodo || j.rawNombre}</span>
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No se encontraron datos en la solapa o nombre distinto</p>
                  )}
                </ul>
              </div>
            </div>

            {/* --- SAN MARTIN (SM) --- */}
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center">
                <h3 className="font-bold text-emerald-900 dark:text-emerald-200">SAN MARTÍN (20:00 hs)</h3>
              </div>

              <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm space-y-2">
                <span className="text-xs font-semibold uppercase text-gray-400">🤖 Motor Local (App)</span>
                <ul className="text-sm space-y-1">
                  {resultadoMotor["SM"]?.conv?.length > 0 ? (
                    resultadoMotor["SM"].conv.map((j: any, i: number) => (
                      <li key={i} className="py-1 border-b border-gray-50 dark:border-gray-800/50 flex justify-between">
                        <span>{i + 1}. {j.nombre}</span>
                        {j.esVip && <span>⭐</span>}
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">Sin jugadores asignados</p>
                  )}
                </ul>
              </div>

              <div className="border border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-gray-900 p-4 rounded-xl shadow-sm space-y-2">
                <span className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">📊 Solapa Script ("20:00 hs SM")</span>
                <ul className="text-sm space-y-1">
                  {obtenerJugadoresDeSolapa("20:00 hs SM").length > 0 ? (
                    obtenerJugadoresDeSolapa("20:00 hs SM").map((j: any, i: number) => (
                      <li key={i} className="py-1 border-b border-blue-100 dark:border-gray-800/50 flex justify-between">
                        <span>{i + 1}. {j.nombre || j.apodo || j.rawNombre}</span>
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No se encontraron datos en la solapa</p>
                  )}
                </ul>
              </div>
            </div>

            {/* --- PUERTOS --- */}
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center">
                <h3 className="font-bold text-emerald-900 dark:text-emerald-200">PUERTOS (21:15 hs)</h3>
              </div>

              <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm space-y-2">
                <span className="text-xs font-semibold uppercase text-gray-400">🤖 Motor Local (App)</span>
                <ul className="text-sm space-y-1">
                  {resultadoMotor["PUERTOS"]?.conv?.length > 0 ? (
                    resultadoMotor["PUERTOS"].conv.map((j: any, i: number) => (
                      <li key={i} className="py-1 border-b border-gray-50 dark:border-gray-800/50 flex justify-between">
                        <span>{i + 1}. {j.nombre}</span>
                        {j.esVip && <span>⭐</span>}
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">Sin jugadores asignados</p>
                  )}
                </ul>
              </div>

              <div className="border border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-gray-900 p-4 rounded-xl shadow-sm space-y-2">
                <span className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">📊 Solapa Script ("21:15 hs PUERTOS")</span>
                <ul className="text-sm space-y-1">
                  {obtenerJugadoresDeSolapa("21:15 hs PUERTOS").length > 0 ? (
                    obtenerJugadoresDeSolapa("21:15 hs PUERTOS").map((j: any, i: number) => (
                      <li key={i} className="py-1 border-b border-blue-100 dark:border-gray-800/50 flex justify-between">
                        <span>{i + 1}. {j.nombre || j.apodo || j.rawNombre}</span>
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No se encontraron datos en la solapa</p>
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
