import React, { useState, useEffect } from 'react';
import { 
  Package, 
  User, 
  CheckCircle2, 
  Send, 
  Loader2, 
  History, 
  MessageCircle, 
  Search,
  AlertCircle
} from 'lucide-react';

// URL de la Web App desplegada desde el Apps Script de "Plantel Oficial"
const APPS_SCRIPT_URL = import.meta.env.VITE_APPSCRIPT_PLANTEL_URL || '';

interface RegistroMaterial {
  id: number;
  fecha: string;
  jugador: string;
  materiales: string;
  lote: string;
  mail: string;
}

const OPCIONES_MATERIALES = [
  { id: 'Amarillas', label: '🟨 Pecheras Amarillas' },
  { id: 'Azules', label: '🟦 Pecheras Azules' },
  { id: 'Rojas', label: '🟥 Pecheras Rojas' },
  { id: 'Naranjas', label: '🟧 Pecheras Naranjas' },
  { id: 'Verdes', label: '🟩 Pecheras Verdes' },
  { id: 'Pelota', label: '⚽ Pelota' },
];

export const Materiales: React.FC = () => {
  // Estados del Formulario
  const [jugador, setJugador] = useState('');
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState<string[]>([]);
  const [loadingGuardar, setLoadingGuardar] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados de Datos
  const [historial, setHistorial] = useState<RegistroMaterial[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // Cargar Préstamos e Historial al Montar
  const cargarDatos = async () => {
    setLoadingHistorial(true);
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=read_materiales`);
      const data = await res.json();
      if (data.success) {
        setHistorial(data.historial || []);
      } else {
        setError('No se pudieron cargar los datos de materiales.');
      }
    } catch (err) {
      console.error('Error cargando materiales:', err);
      setError('Error de conexión con Google Sheets.');
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    if (APPS_SCRIPT_URL) cargarDatos();
  }, []);

  // Manejar Selección de Materiales
  const toggleMaterial = (item: string) => {
    setMaterialesSeleccionados((prev) =>
      prev.includes(item) ? prev.filter((m) => m !== item) : [...prev, item]
    );
  };

  // Guardar Entrega
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jugador.trim()) {
      setError('Por favor indicá el nombre del jugador.');
      return;
    }
    if (materialesSeleccionados.length === 0) {
      setError('Seleccioná al menos un material entregado.');
      return;
    }

    setLoadingGuardar(true);
    setError(null);
    setMensajeExito(null);

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          params: {
            jugador: jugador.trim(),
            materiales: materialesSeleccionados,
          },
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMensajeExito(`Materiales asignados a ${jugador} con éxito.`);
        setJugador('');
        setMaterialesSeleccionados([]);
        cargarDatos();
      } else {
        setError(data.error || 'Ocurrió un error al guardar.');
      }
    } catch (err) {
      console.error('Error guardando materiales:', err);
      setError('Error de comunicación con la base de datos.');
    } finally {
      setLoadingGuardar(false);
    }
  };

  // Generar link de WhatsApp para aviso
  const armarLinkWhatsapp = (item: RegistroMaterial) => {
    const msj = `Hola ${item.jugador}! Recordá que tenés prestado: ${item.materiales}. Acordate de llevarlo al próximo partido.`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(msj)}`;
  };

  // Filtrado de historial
  const historialFiltrado = historial.filter(
    (h) =>
      h.jugador.toLowerCase().includes(busqueda.toLowerCase()) ||
      h.materiales.toLowerCase().includes(busqueda.toLowerCase()) ||
      h.lote.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      {/* Encabezado */}
      <div className="flex items-center gap-3 border-b pb-4">
        <Package className="w-8 h-8 text-green-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Entrega y Registro de Materiales</h1>
          <p className="text-sm text-gray-500">Control de pecheras y pelotas asignadas al plantel oficial</p>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 flex items-center justify-between rounded">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-sm font-bold">✕</button>
        </div>
      )}

      {mensajeExito && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 text-green-700 flex items-center justify-between rounded">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito(null)} className="text-sm font-bold">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORMULARIO DE ENTREGA */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" /> Nueva Entrega
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jugador</label>
              <input
                type="text"
                placeholder="Nombre o Apodo..."
                value={jugador}
                onChange={(e) => setJugador(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">¿Qué se lleva?</label>
              <div className="space-y-2">
                {OPCIONES_MATERIALES.map((mat) => (
                  <label
                    key={mat.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      materialesSeleccionados.includes(mat.id)
                        ? 'bg-green-50 border-green-300 font-medium'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm text-gray-700">{mat.label}</span>
                    <input
                      type="checkbox"
                      checked={materialesSeleccionados.includes(mat.id)}
                      onChange={() => toggleMaterial(mat.id)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingGuardar}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loadingGuardar ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Guardar Entrega
                </>
              )}
            </button>
          </form>
        </div>

        {/* TABLA DE PRÉSTAMOS E HISTORIAL */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <History className="w-5 h-5 text-green-600" /> Historial de Préstamos
            </h2>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por jugador o lote..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none w-full sm:w-60"
              />
            </div>
          </div>

          {loadingHistorial ? (
            <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
              <span>Cargando préstamos...</span>
            </div>
          ) : historialFiltrado.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No se encontraron entregas de materiales.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                  <tr>
                    <th className="py-3 px-3">Fecha</th>
                    <th className="py-3 px-3">Jugador</th>
                    <th className="py-3 px-3">Materiales</th>
                    <th className="py-3 px-3">Lote</th>
                    <th className="py-3 px-3 text-center">Aviso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historialFiltrado.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-3 text-gray-500 whitespace-nowrap">{item.fecha}</td>
                      <td className="py-3 px-3 font-medium text-gray-800">{item.jugador}</td>
                      <td className="py-3 px-3 text-gray-600">{item.materiales}</td>
                      <td className="py-3 px-3 text-gray-500">{item.lote || '-'}</td>
                      <td className="py-3 px-3 text-center">
                        <a
                          href={armarLinkWhatsapp(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2.5 py-1 rounded-full font-medium transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Enviar
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Materiales;
