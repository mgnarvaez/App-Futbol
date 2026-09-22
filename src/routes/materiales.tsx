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
  ChevronDown,
  X,
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

function limpiarTelefono(tel: string): string {
  if (!tel) return "";
  let limpio = tel.replace(/\D/g, "");
  if (!limpio) return "";
  if (limpio.startsWith("549")) return limpio;
  if (limpio.startsWith("54")) return "549" + limpio.slice(2);
  if (limpio.startsWith("11") || limpio.startsWith("15")) {
    if (limpio.startsWith("15")) limpio = "11" + limpio.slice(2);
    return "549" + limpio;
  }
  return "549" + limpio;
}

function MaterialesPage() {
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState<JugadorPlantelSheet | null>(null);
  const [busquedaJugador, setBusquedaJugador] = useState("");
  const [dropdownAbierto, setDropdownAbierto] = useState(false);

  const [plantel, setPlantel] = useState<JugadorPlantelSheet[]>([]);
  const [loadingPlantel, setLoadingPlantel] = useState(true);

  const [materialesSeleccionados, setMaterialesSeleccionados] = useState<string[]>([]);
  const [loadingGuardar, setLoadingGuardar] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [historial, setHistorial] = useState<RegistroMaterialSheet[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [busquedaHistorial, setBusquedaHistorial] = useState("");

  const cargarDatos = async () => {
    setLoadingHistorial(true);
    setLoadingPlantel(true);
    try {
      const [matData, plantelData] = await Promise.all([
        obtenerMaterialesSheet(),
        obtenerPlantelSheet(),
      ]);
      setHistorial(matData.historial || []);
      setPlantel(plantelData || []);
    } catch (err) {
      console.error("Error cargando datos:", err);
      setError("Error de conexión con Google Sheets.");
    } finally {
      setLoadingHistorial(false);
      setLoadingPlantel(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
  }, []);

  const toggleMaterial = (item: string) => {
    setMaterialesSeleccionados((prev) =>
      prev.includes(item) ? prev.filter((m) => m !== item) : [...prev, item]
    );
  };

  const jugadoresFiltrados = plantel.filter((j) => {
    const termino = busquedaJugador.toLowerCase().trim();
    if (!termino) return true;
    const apodo = (j.apodo || "").toLowerCase();
    const nombre = (j.nombre || "").toLowerCase();
    const lote = (j.lote || "").toLowerCase();
    return apodo.includes(termino) || nombre.includes(termino) || lote.includes(termino);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jugadorSeleccionado) {
      setError("Por favor seleccioná un jugador registrado de la lista.");
      return;
    }
    if (materialesSeleccionados.length === 0) {
      setError("Seleccioná al menos un material entregado.");
      return;
    }

    setLoadingGuardar(true);
    setError(null);
    setMensajeExito(null);

    const nombreFinal = jugadorSeleccionado.apodo || jugadorSeleccionado.nombre;

    try {
      const res = await registrarMaterialesSheet(nombreFinal, materialesSeleccionados);
      if (res.ok) {
        setMensajeExito(`Materiales asignados a ${nombreFinal} con éxito.`);
        setJugadorSeleccionado(null);
        setBusquedaJugador("");
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

  const armarLinkWhatsapp = (item: RegistroMaterialSheet) => {
    const msj = `Hola ${item.jugador}! Recordá que tenés prestado: ${item.materiales}. Acordate de llevarlo al próximo partido.`;
    
    // Buscar teléfono en el plantel
    const p = plantel.find(
      (j) =>
        (j.apodo && j.apodo.toLowerCase() === item.jugador.toLowerCase()) ||
        (j.nombre && j.nombre.toLowerCase() === item.jugador.toLowerCase()) ||
        (j.email && item.mail && j.email.toLowerCase() === item.mail.toLowerCase())
    );

    const telLimpio = p?.telefono ? limpiarTelefono(p.telefono) : "";

    if (telLimpio) {
      return `https://api.whatsapp.com/send?phone=${telLimpio}&text=${encodeURIComponent(msj)}`;
    }
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(msj)}`;
  };

  const historialFiltrado = historial.filter(
    (h) =>
      h.jugador.toLowerCase().includes(busquedaHistorial.toLowerCase()) ||
      h.materiales.toLowerCase().includes(busquedaHistorial.toLowerCase()) ||
      h.lote.toLowerCase().includes(busquedaHistorial.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8 pb-24 sm:pb-8">
      {/* Encabezado */}
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

      {/* Mensajes de Estado */}
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
        {/* FORMULARIO DE ENTREGA */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" /> Nueva Entrega
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Buscador / Seleccionador Estricto de Jugadores */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jugador (Registrado en Plantel)
              </label>

              {jugadorSeleccionado ? (
                <div className="flex items-center justify-between p-2.5 border-2 border-green-500 bg-green-50 rounded-lg">
                  <div>
                    <span className="font-semibold text-gray-800">
                      {jugadorSeleccionado.apodo || jugadorSeleccionado.nombre}
                    </span>
                    {jugadorSeleccionado.lote && (
                      <span className="text-xs text-gray-500 ml-2">
                        (Lote: {jugadorSeleccionado.lote})
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setJugadorSeleccionado(null);
                      setBusquedaJugador("");
                      setDropdownAbierto(true);
                    }}
                    className="p-1 hover:bg-green-200 rounded-full text-gray-600"
                    title="Cambiar jugador"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={
                        loadingPlantel
                          ? "Cargando lista de jugadores..."
                          : "Buscar por apodo, nombre o lote..."
                      }
                      disabled={loadingPlantel}
                      value={busquedaJugador}
                      onChange={(e) => {
                        setBusquedaJugador(e.target.value);
                        setDropdownAbierto(true);
                      }}
                      onFocus={() => setDropdownAbierto(true)}
                      className="w-full pl-3 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
                    />
                    <ChevronDown className="w-4 h-4 absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
                  </div>

                  {dropdownAbierto && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto divide-y divide-gray-100">
                      {jugadoresFiltrados.length === 0 ? (
                        <div className="p-3 text-xs text-gray-500 text-center">
                          {loadingPlantel
                            ? "Cargando plantel..."
                            : "No se encontró ningún jugador registrado con ese nombre."}
                        </div>
                      ) : (
                        jugadoresFiltrados.map((j, idx) => {
                          const apodoONombre = j.apodo || j.nombre;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setJugadorSeleccionado(j);
                                setDropdownAbierto(false);
                              }}
                              className="w-full text-left px-3 py-2.5 hover:bg-green-50 transition-colors flex items-center justify-between text-sm"
                            >
                              <div>
                                <span className="font-medium text-gray-800">
                                  {apodoONombre}
                                </span>
                                {j.apodo && j.nombre && j.apodo !== j.nombre && (
                                  <span className="text-xs text-gray-400 ml-1">
                                    ({j.nombre})
                                  </span>
                                )}
                              </div>
                              {j.lote && (
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                  Lote {j.lote}
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Checklist Materiales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Qué se lleva?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {OPCIONES_MATERIALES.map((mat) => (
                  <label
                    key={mat.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      materialesSeleccionados.includes(mat.id)
                        ? "bg-green-50 border-green-300 font-medium"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xs sm:text-sm text-gray-700">
                      {mat.label}
                    </span>
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

            {/* Botón Guardar */}
            <button
              type="submit"
              disabled={loadingGuardar || !jugadorSeleccionado}
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
                value={busquedaHistorial}
                onChange={(e) => setBusquedaHistorial(e.target.value)}
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
            <div className="space-y-4">
              {/* Tabla para Pantallas Medianas / Grandes */}
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
                            <MessageCircle className="w-3.5 h-3.5" /> Enviar
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista Móvil (Tarjetas para Celular Vertical) */}
              <div className="sm:hidden space-y-3">
                {historialFiltrado.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-gray-50 rounded-lg border border-gray-100 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800 text-sm">
                        {item.jugador}
                      </span>
                      <span className="text-xs text-gray-400">{item.fecha}</span>
                    </div>

                    <div className="text-xs text-gray-600">
                      <span className="font-medium text-gray-700">Materiales:</span>{" "}
                      {item.materiales}
                    </div>

                    {item.lote && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Lote:</span> {item.lote}
                      </div>
                    )}

                    <div className="pt-2 border-t flex justify-end">
                      <a
                        href={armarLinkWhatsapp(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 w-full text-xs bg-green-600 text-white hover:bg-green-700 py-2 px-3 rounded-lg font-medium transition-colors"
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
