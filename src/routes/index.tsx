import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CloudRain, ExternalLink, Loader2, RefreshCw, Shuffle, UserMinus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { armadorService } from "@/lib/services/armadorService";
import { convocatoriaService } from "@/lib/services/convocatoriaService";
import {
  FORM_URL,
  sincronizacionService,
} from "@/lib/services/sincronizacionService";
import {
  ejecutarOrganizarConvocadosSheet,
  obtenerInscriptosSheet,
  obtenerPlantelSheet,
  registrarBajaSheet,
} from "@/lib/sheets.functions";
import { useAppStore } from "@/lib/store";
import {
  SEDES,
  SEDE_LABELS,
  type EstadoPago,
  type Inscripcion,
  type Sede,
} from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Panel de convocatorias de fútbol" },
      {
        name: "description",
        content:
          "Panel del día: inscripción automática por Google Form, suspensión por lluvia, armado de convocados y control de pagos.",
      },
      { property: "og:title", content: "Panel de convocatorias de fútbol" },
      {
        property: "og:description",
        content:
          "Inscripción automática desde el formulario, suspensión de sedes y armado de convocados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Panel,
});

function Panel() {
  const {
    convocatoriaActual,
    inscripciones,
    cargando,
    cargarConvocatoriaDelDia,
    crearConvocatoria,
    abrirConvocatoria,
    cargarJugadores,
    actualizarEstadoPago,
  } = useAppStore();

  const [armando, setArmando] = useState(false);
  const [bajando, setBajando] = useState(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [convocandoSheet, setConvocandoSheet] = useState(false);
  const preparando = useRef(false);

  const { data: inscriptosSheet, refetch: refetchSheet } = useQuery({
    queryKey: ["inscriptos-sheet"],
    queryFn: () => obtenerInscriptosSheet(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    void cargarConvocatoriaDelDia();
    void cargarJugadores();
  }, [cargarConvocatoriaDelDia, cargarJugadores]);

  const hoy = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (cargando || preparando.current) return;
    if (!convocatoriaActual) {
      preparando.current = true;
      void crearConvocatoria(hoy).finally(() => {
        preparando.current = false;
      });
      return;
    }
    if (convocatoriaActual.estado === "PLANIFICADA") {
      preparando.current = true;
      void abrirConvocatoria().finally(() => {
        preparando.current = false;
      });
    }
  }, [cargando, convocatoriaActual, crearConvocatoria, abrirConvocatoria, hoy]);

  const lluvia = convocatoriaActual?.suspension_lluvia ?? false;
  const canceladas = convocatoriaActual?.sedes_canceladas ?? [];

  const toggleSede = async (sede: Sede, cancelada: boolean) => {
    if (!convocatoriaActual) return;
    const nuevas = cancelada
      ? [...canceladas, sede]
      : canceladas.filter((s) => s !== sede);
    try {
      await convocatoriaService.actualizarSuspensiones(
        convocatoriaActual.id,
        lluvia,
        nuevas,
      );
      await cargarConvocatoriaDelDia();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar sedes");
    }
  };

  const toggleLluvia = async (valor: boolean) => {
    if (!convocatoriaActual) return;
    try {
      await convocatoriaService.actualizarSuspensiones(
        convocatoriaActual.id,
        valor,
        canceladas,
      );
      await cargarConvocatoriaDelDia();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar lluvia");
    }
  };

  const sincronizar = async () => {
    if (!convocatoriaActual) return;
    setSincronizando(true);
    try {
      const { data } = await refetchSheet();
      const filas = data ?? [];
      const resultado = await sincronizacionService.sincronizarInscriptos(
        convocatoriaActual.id,
        filas,
      );
      const plantel = await obtenerPlantelSheet();
      const pagos = await sincronizacionService.sincronizarPagos(plantel);
      toast.success(
        `\({resultado.nuevos} inscripto(s) nuevo(s) de\){resultado.total} en la planilla · ${pagos.deben} sin pagar`,
      );
      await cargarConvocatoriaDelDia();
      await cargarJugadores();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al sincronizar inscriptos",
      );
    } finally {
      setSincronizando(false);
    }
  };

  const convocarSheet = async () => {
    setConvocandoSheet(true);
    try {
      const res = await ejecutarOrganizarConvocadosSheet();
      if (res.ok) {
        toast.success(res.mensaje);
        await refetchSheet();
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

  const armar = async () => {
    if (!convocatoriaActual) return;
    setArmando(true);
    try {
      const resultado = await armadorService.armarEquipos(convocatoriaActual.id);
      toast.success(
        `Convocados armados · ${resultado.noAsignados.length} jugador(es) sin asignar`,
      );
      await cargarConvocatoriaDelDia();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al armar convocados");
    } finally {
      setArmando(false);
    }
  };

  const bajar = async (inscripcion: Inscripcion) => {
    const apodo = inscripcion.jugador?.apodo || inscripcion.jugador?.nombre || "Jugador";
    if (!confirm(`¿Confirmás dar de baja a "${apodo}" en la planilla?`)) return;

    setBajando(inscripcion.id);
    try {
      await convocatoriaService.darDeBaja(inscripcion);
      const resSheet = await registrarBajaSheet(apodo, "Baja registrada desde App Web");
      if (resSheet.ok) {
        toast.success(`Baja de ${apodo} registrada en la planilla.`);
      } else {
        toast.error(`Local ok, pero falló Sheet: ${resSheet.mensaje}`);
      }

      await cargarConvocatoriaDelDia();
      await refetchSheet();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al dar de baja");
    } finally {
      setBajando(null);
    }
  };

  return (
    
      
        
          Convocatoria de hoy · {hoy}
          {convocatoriaActual && (
            
              {convocatoriaActual.estado}
            
          )}
        
        
          {!convocatoriaActual ? (
