import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Package,
  User,
  CheckCircle2,
  Send,
  Loader2,
  History,
  MessageCircle,
  Search,
  AlertCircle,
} from "lucide-react";
import {
  obtenerMaterialesSheet,
  registrarMaterialesSheet,
  obtenerPlantelSheet,
  type RegistroMaterialSheet,
  type JugadorPlantelSheet,
} from "@/lib/sheets.functions";

export const Route = createFileRoute("/materiales")({
  component: MaterialesPage,
});

const OPCIONES_MATERIALES = [
  { id: "Amarillas", label: "🟨 Pecheras Amarillas" },
  { id: "Azules", label: "🟦 Pecheras Azules" },
  { id: "Rojas", label: "🟥 Pecheras Rojas" },
  { id: "Naranjas", label: "🟧 Pecheras Naranjas" },
  { id: "Verdes", label: "🟩 Pecheras Verdes" },
  { id: "Pelota", label: "⚽ Pelota" },
];

const LINK_INSCRIPCION_VIP = "https://forms.gle/AvMwDfZ68FSVhACN8";

function MaterialesPage() {
  const [jugador, setJugador] = useState("");
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState<JugadorPlantelSheet | null>(null);
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState<string[]>([]);
  const [loadingGuardar, setLoadingGuardar] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [historial, setHistorial] = useState<RegistroMaterialSheet[]>([]);
  const [plantel, setPlantel] = useState<JugadorPlantelSheet[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const cargarDatos = async () => {
    setLoadingHistorial(true);
    try {
      const [dataMat, dataPlantel] = await Promise.all([
        obtenerMaterialesSheet(),
        obtenerPlantelSheet(),
      ]);
      setHistorial(dataMat.historial || []);
      setPlantel(dataPlantel || []);
    } catch (err) {
      console.error("Error cargando datos:", err);
      setError("Error de conexión con Google Sheets.");
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
  }, []);

  const jugadoresFiltrados = plantel.filter((p) => {
    if (!jugador.trim()) return false;
    const q = jugador.toLowerCase();
    const apodo = (p.apodo || "").toLowerCase();
    const nombre = (p.nombre || "").toLowerCase();
    const lote = (p.lote || "").toLowerCase();
    return apodo.includes(q) || nombre.includes(q) || lote.includes(q);
  });

  const toggleMaterial = (item: string) => {
    setMaterialesSeleccionados((prev) =>
      prev.includes(item) ? prev.filter((m) => m !== item) : [...prev, item]
    );
  };

  const seleccionarJugador = (p: JugadorPlantelSheet) => {
    const displayNombre = p.apodo || p.nombre;
    setJugador(displayNombre);
    setJugadorSeleccionado(p);
    setMostrarSugerencias(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jugador.trim()) {
      setError("Por favor seleccioná un jugador del plantel.");
      return;
    }
    if (materialesSeleccionados.length === 0) {
      setError("Seleccioná al menos un material entregado.");
      return;
    }

    setLoadingGuardar(true);
    setError(null);
    setMensajeExito(null);

    try {
      const nombreFinal = jugadorSeleccionado
        ? jugadorSeleccionado.apodo || jugadorSeleccionado.nombre
        : jugador.trim();

      const res = await registrarMaterialesSheet(nombreFinal, materialesSeleccionados);
      if (res.ok) {
        setMensajeExito(`Materiales asignados a ${nombreFinal} con éxito.`);
        setJugador("");
        setJugadorSeleccionado(null);
        setMaterialesSeleccionados([]);
        await cargarDatos();
      } else {
        setError(res.mensaje);
      }
    } catch (err) {
      console.error("Error guardando materiales:", err);
      setError("Error de comunicación con la base de datos.");
    } finally {
      setLoadingGuardar(false);
    }
  };

  const formatearTelefono = (telRaw: string) => {
    if (!telRaw) return "";
    let clean = telRaw.replace(/\D/g, "");
    if (!clean) return "";
    if (clean.length === 10 && clean.startsWith("11")) {
      clean = "549" + clean;
    } else if (clean.length === 10 && !clean.startsWith("54")) {
      clean = "549" + clean;
    } else if (clean.startsWith("54") && !clean.startsWith("549") && clean.length === 12) {
      clean = "549" + clean.slice(2);
    }
    return clean;
  };

  const armarLinkWhatsapp = (item: RegistroMaterialSheet) => {
    const nombreContacto = item.jugador;
    const msj = `Hola ${nombreContacto}! Recordá que tenés prestado: ${item.materiales}. Acordate de llevarlo al próximo partido. Aca tenes el link para anotarte en cualquier momento antes de lunes y asegurarte participacion: ${LINK_INSCRIPCION_VIP}`;

    const pEncontrado = plantel.find(
      (p) =>
        (p.apodo && p.apodo.toLowerCase() === item.jugador.toLowerCase()) ||
        (p.nombre && p.nombre.toLowerCase() === item.jugador.toLowerCase())
    );

    const numTel = pEncontrado ? formatearTelefono(pEncontrado.telefono) : "";

    if (numTel) {
      return `https://api.whatsapp.com/send?phone=${numTel}&text=${encodeURIComponent(msj)}`;
    }
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(msj)}`;
  };

  const historialFiltrado = historial.filter(
    (h) =>
      h.jugador.toLowerCase().includes(busqueda.toLowerCase()) ||
      h.materiales.toLowerCase().includes(busqueda.toLowerCase()) ||
      h.lote.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8 pb-20 sm:pb-8">
      <div className="flex items-center gap-3 border-b pb-4">
        <Package className="w-8 h-8 text-green-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Entrega y Registro de Materiales
          </h1>
          <p className="text-sm text-gray-500">
            Control de pecheras y pelotas asignadas al plantel oficial
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 flex items-center justify-between rounded">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-sm font-bold">
            ✕
          </button>
        </div>
      )}

      {mensajeExito && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 text-green-700 flex items-center justify-between rounded">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito(null)} className="text-sm font-bold">
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORMULARIO DE NUEVA ENTREGA */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" /> Nueva Entrega
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Buscador / Autocompletado de Jugador */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jugador (Buscar en el Plantel)
              </label>
              <input
                type="text"
                placeholder="Escribí apodo, nombre o lote..."
                value={jugador}
                onChange={(e) => {
                  setJugador(e.target.value);
                  setJugadorSeleccionado(null);
                  setMostrarSugerencias(true);
                }}
                onFocus={() => setMostrarSugerencias(true)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />

              {/* Menú Desplegable de Sugerencias */}
              {mostrarSugerencias && jugadoresFiltrados.length > 0 && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {jugadoresFiltrados.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => seleccionarJugador(p)}
                      className="w-full text-left px-3 py-2 hover:bg-green-50 text-sm flex justify-between items-center"
                    >
                      <div>
                        <span className="font-semibold text-gray-800">
                          {p.apodo || p.nombre}
                        </span>
                        {p.apodo && p.nombre && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({p.nombre})
                          </span>
                        )}
                      </div>
                      {p.lote && (
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                          Lote {p.lote}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Checklist de Materiales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Qué se lleva?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                {OPCIONES_MATERIALES.map((mat) => (
                  <label
                    key={mat.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      materialesSeleccionados.includes(mat.id)
                        ? "bg-green-50 border-green-300 font-medium"
                        : "border-gray-200 hover:bg-gray-50"
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

        {/* HISTORIAL Y PRÉSTAMOS */}
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
            <div className="text-center py-12 text-gray-400">
              No se encontraron entregas de materiales.
            </div>
          ) : (
            <div>
              {/* VISTA TABLA (Pantallas Medianas y Grandes) */}
              <div className="hidden sm:block overflow-x-auto">
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
                        <td className="py-3 px-3 text-gray-500 whitespace-nowrap">
                          {item.fecha}
                        </td>
                        <td className="py-3 px-3 font-medium text-gray-800">
                          {item.jugador}
                        </td>
                        <td className="py-3 px-3 text-gray-600">{item.materiales}</td>
                        <td className="py-3 px-3 text-gray-500">{item.lote || "-"}</td>
                        <td className="py-3 px-3 text-center">
                          <a
                            href={armarLinkWhatsapp(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2.5 py-1 rounded-full font-medium transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Enviar WhatsApp
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* VISTA TARJETAS RESPONSIVE (Móviles) */}
              <div className="sm:hidden space-y-3">
                {historialFiltrado.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border border-gray-100 rounded-lg bg-gray-50/50 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-gray-800 block">
                          {item.jugador}
                        </span>
                        <span className="text-xs text-gray-400">{item.fecha}</span>
                      </div>
                      {item.lote && (
                        <span className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-600 font-medium">
                          Lote {item.lote}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">
                      <strong className="text-gray-500">Llevó:</strong> {item.materiales}
                    </p>
                    <div className="pt-2 border-t border-gray-200/60 flex justify-end">
                      <a
                        href={armarLinkWhatsapp(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 rounded-lg font-medium transition-colors w-full justify-center"
                      >
                        <MessageCircle className="w-4 h-4" /> Enviar WhatsApp
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MaterialesPage;
