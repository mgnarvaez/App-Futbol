import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { leerInscriptos } from "@/lib/sheets.functions";
import { correrMotorConvocados, type EngineConfig } from '@/squadEngine';

export const Route = createFileRoute('/motor')({
  component: MotorNativoPage,
});

function MotorNativoPage() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [reporte, setReporte] = useState<string[]>([]);

  const ejecutarMotorLocal = async () => {
    setLoading(true);
    try {
      // 1. Leemos los inscriptos crudos de las solapas de la Sheet
      const inscriptos = await leerInscriptos();

      // 2. Configuración inicial por defecto del motor
      const config: EngineConfig = {
        suspensionLluvia: "SOL",
        suspensionOtra1: "NINGUNA",
        suspensionOtra2: "NINGUNA",
        puertos10vs10: false,
        bajasManuales: [],
        pagosManuales: {},
      };

      // 3. Corremos el motor nativamente en el navegador
      const sedesNativas = correrMotorConvocados(inscriptos, config);

      setResultado(sedesNativas);
      setReporte([`✅ ¡Motor nativo ejecutado con éxito! Se procesaron ${inscriptos.length} inscriptos totales.`]);
    } catch (error) {
      console.error(error);
      setReporte(["❌ Ocurrió un error al ejecutar el motor nativo."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">🤖 Motor Nativo de Convocados</h1>
          <p className="text-gray-600">Calcula los equipos localmente en la app usando las reglas de tu planilla sin tocar Google Apps Script.</p>
        </div>
        <button
          onClick={ejecutarMotorLocal}
          disabled={loading}
          className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-sm transition-colors"
        >
          {loading ? "Calculando..." : "🚀 Correr Motor Local"}
        </button>
      </div>

      {reporte.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          {reporte.map((r, i) => (
            <p key={i} className="text-blue-900 font-medium">{r}</p>
          ))}
        </div>
      )}

      {resultado && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {Object.keys(resultado).map((sedeKey) => {
            const sede = resultado[sedeKey];
            return (
              <div key={sedeKey} className="border border-gray-200 bg-white p-5 rounded-xl shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-bold text-lg text-gray-800">{sedeKey}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${sede.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {sede.activa ? "Activa" : "Suspendida"}
                  </span>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Convocados ({sede.conv.length}):</h4>
                  {sede.conv.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Sin convocados</p>
                  ) : (
                    <ul className="text-sm space-y-1 pl-2">
                      {sede.conv.map((j: any, idx: number) => (
                        <li key={idx} className="flex justify-between items-center py-1 border-b border-gray-50">
                          <span>{idx + 1}. {j.nombre}</span>
                          <div className="flex gap-1">
                            {j.esVip && <span title="VIP">⭐</span>}
                            {j.flex && <span title="Flexible">🔄</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {sede.supl.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-amber-700 mb-1">Suplentes ({sede.supl.length}):</h4>
                    <ul className="text-sm space-y-1 pl-2 text-gray-600">
                      {sede.supl.map((j: any, idx: number) => (
                        <li key={idx}>
                          {idx + 1}. {j.nombre}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}