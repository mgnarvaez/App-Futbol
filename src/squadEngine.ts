import type { InscriptoSheet } from "@/services/sheets.functions";

export interface VenueCapacity {
  [key: string]: number;
}

export interface EngineConfig {
  suspensionLluvia: string; // "SOL", "CANTON", "SM", "PUERTOS"
  suspensionOtra1: string;  // "NINGUNA", "CANTON", etc.
  suspensionOtra2: string;  // "NINGUNA", "CANTON", etc.
  puertos10vs10: boolean;   // true para cap 20 en Puertos
  bajasManuales: string[];  // Apodos de jugadores dados de baja
  pagosManuales: Record<string, boolean>; // email -> true/false
}

export interface PlayerProcessed {
  timestamp: number;
  indice: number;
  pref: string;
  flex: boolean;
  nombre: string;
  esVip: boolean;
  juegaConLluvia: boolean;
  email: string;
  pagoAlDia: boolean;
}

export function correrMotorConvocados(inscriptosCrudos: InscriptoSheet[], config: EngineConfig) {
  const ordenHojas = ["CANTON", "SM", "PUERTOS"];
  
  const reglasSedes: VenueCapacity = {
    "CANTON": 14,
    "SM": 16,
    "PUERTOS": config.puertos10vs10 ? 20 : 14
  };

  let indiceGeneral = 0;

  // 1. Mapeo inicial de inscriptos
  let jugadores: PlayerProcessed[] = inscriptosCrudos.map((j) => {
    const mailTrim = j.email.toLowerCase().trim();
    const pagoOk = config.pagosManuales[mailTrim] !== undefined ? config.pagosManuales[mailTrim] : true;
    
    let timestampNum = Date.now();
    if (j.timestamp) {
      const parsed = new Date(j.timestamp).getTime();
      if (!isNaN(parsed)) timestampNum = parsed;
    }

    let sedePref = "CANTON";
    const tUpper = (j.turno || "").toUpperCase();
    if (tUpper.includes("PUERTOS")) sedePref = "PUERTOS";
    else if (tUpper.includes("SM") || tUpper.includes("MATIAS") || tUpper.includes("MATÍAS")) sedePref = "SM";

    return {
      timestamp: timestampNum,
      indice: indiceGeneral++,
      pref: sedePref,
      flex: j.flexible,
      nombre: j.apodo,
      esVip: j.vip,
      juegaConLluvia: j.juega_con_lluvia,
      email: j.email,
      pagoAlDia: pagoOk
    };
  });

  // 2. Filtrado de bajas manuales
  const bajasSet = new Set(config.bajasManuales.map(b => b.toLowerCase().trim()));
  jugadores = jugadores.filter(j => !bajasSet.has(j.nombre.toLowerCase().trim()));

  // 3. Inicialización estricta de estados de las sedes (Activas o Canceladas)
  const sedes: Record<string, { activa: boolean; motivo: string; conv: PlayerProcessed[]; supl: PlayerProcessed[] }> = {};
  
  const hayLluvia = config.suspensionLluvia !== "SOL";
  if (hayLluvia) {
    jugadores = jugadores.filter(j => j.juegaConLluvia);
  }

  ordenHojas.forEach(n => {
    sedes[n] = { activa: true, motivo: "", conv: [], supl: [] };
    
    if (hayLluvia && n.toUpperCase().includes(config.suspensionLluvia.toUpperCase())) {
      sedes[n].activa = false;
      sedes[n].motivo = "CANCELADA POR LLUVIA";
    }
    if (config.suspensionOtra1 !== "NINGUNA" && n.toUpperCase().includes(config.suspensionOtra1.toUpperCase())) {
      sedes[n].activa = false;
      sedes[n].motivo = "SEDE CANCELADA";
    }
    if (config.suspensionOtra2 !== "NINGUNA" && n.toUpperCase().includes(config.suspensionOtra2.toUpperCase())) {
      sedes[n].activa = false;
      sedes[n].motivo = "SEDE CANCELADA";
    }
  });

  // 4. Orden de prioridad estricta: Pagos -> VIP -> Cronológico
  jugadores.sort((a, b) => {
    if (a.pagoAlDia !== b.pagoAlDia) return a.pagoAlDia ? -1 : 1;
    if (a.esVip !== b.esVip) return a.esVip ? -1 : 1;
    if (a.timestamp === b.timestamp) return a.indice - b.indice;
    return a.timestamp - b.timestamp;
  });

  // 5. Asignación inicial respetando preferencias y BLOQUEANDO sedes inactivas
  jugadores.forEach(jug => {
    let asignado = false;
    const sedePreferidaActiva = sedes[jug.pref] && sedes[jug.pref].activa;
    
    if (sedePreferidaActiva && sedes[jug.pref].conv.length < reglasSedes[jug.pref]) {
      sedes[jug.pref].conv.push(jug);
      asignado = true;
    }
    
    // Si no pudo entrar a su preferencia (porque está llena o porque la sede está CANCELADA) y es flexible
    if (!asignado && jug.flex) {
      for (let i = 0; i < ordenHojas.length; i++) {
        let otraSede = ordenHojas[i];
        if (sedes[otraSede] && sedes[otraSede].activa && sedes[otraSede].conv.length < reglasSedes[otraSede]) {
          sedes[otraSede].conv.push(jug);
          asignado = true;
          break;
        }
      }
    }
    
    if (!asignado) {
      if (sedePreferidaActiva) {
        sedes[jug.pref].supl.push(jug);
      } else {
        // Si su sede preferida estaba inactiva (como SM), NUNCA va ahí. Va a la primera sede activa disponible.
        let primeraActiva = ordenHojas.find(n => sedes[n].activa);
        if (primeraActiva) {
          sedes[primeraActiva].supl.push(jug);
        }
      }
    }
  });

  // 6. BALANCEO ESTRICTO: Solo rellenar sedes que estén ACTIVA y les falte gente, 
  // moviendo jugadores flexibles de otras sedes ACTIVAS (jamás tocando las canceladas).
  ordenHojas.forEach(sedeIncompleta => {
    // REGLA CRUCIAL: La sede incompleta DEBE estar activa para poder recibir refuerzos
    if (sedes[sedeIncompleta].activa) {
      let cupoTotal = reglasSedes[sedeIncompleta];

      while (sedes[sedeIncompleta].conv.length < cupoTotal) {
        let movimientoRealizado = false;

        // A. Si hay suplentes esperando en esta misma sede activa, suben directo
        if (sedes[sedeIncompleta].supl.length > 0) {
          let promovido = sedes[sedeIncompleta].supl.shift()!;
          sedes[sedeIncompleta].conv.push(promovido);
          movimientoRealizado = true;
          continue;
        }

        // B. Si no hay suplentes, buscamos jugadores flexibles en otras sedes ACTIVAS para hacer trueque
        for (let i = 0; i < ordenHojas.length; i++) {
          let sedeLlena = ordenHojas[i];
          // Validamos estrictamente que la sede fuente también esté activa
          if (sedeLlena !== sedeIncompleta && sedes[sedeLlena].activa && sedes[sedeLlena].conv.length > 0) {
            
            // Buscamos de atrás hacia adelante al jugador flexible (los deudores flexibles se mueven primero)
            let indexFlexible = -1;
            for (let j = sedes[sedeLlena].conv.length - 1; j >= 0; j--) {
              if (sedes[sedeLlena].conv[j].flex) {
                indexFlexible = j;
                break;
              }
            }

            if (indexFlexible !== -1) {
              let jugadorFlexible = sedes[sedeLlena].conv.splice(indexFlexible, 1)[0];
              sedes[sedeIncompleta].conv.push(jugadorFlexible);

              if (sedes[sedeLlena].supl.length > 0) {
                let suplentePromovido = sedes[sedeLlena].supl.shift()!;
                sedes[sedeLlena].conv.push(suplentePromovido);
              }

              movimientoRealizado = true;
              break;
            }
          }
        }

        if (!movimientoRealizado) break; 
      }
    }
  });

  // 7. Reordenamiento final por prioridad estricta en cada lista
  const comparadorPrioridad = (a: PlayerProcessed, b: PlayerProcessed) => {
    if (a.pagoAlDia !== b.pagoAlDia) return a.pagoAlDia ? -1 : 1;
    if (a.esVip !== b.esVip) return a.esVip ? -1 : 1;
    if (a.timestamp === b.timestamp) return a.indice - b.indice;
    return a.timestamp - b.timestamp;
  };

  ordenHojas.forEach(n => {
    sedes[n].conv.sort(comparadorPrioridad);
    sedes[n].supl.sort(comparadorPrioridad);
  });

  return sedes;
}

export function compararConvocados(
  inscriptosCrudos: InscriptoSheet[], 
  sedesDeLaSheet: Record<string, any>, 
  config: EngineConfig
) {
  const sedesNativas = correrMotorConvocados(inscriptosCrudos, config);
  let diferenciasEncontradas = false;
  const reporte: string[] = [];

  Object.keys(sedesNativas).forEach(sedeKey => {
    const nativosConv = sedesNativas[sedeKey].conv.map(j => j.nombre.toLowerCase().trim());
    
    const sheetSedeData = sedesDeLaSheet[sedeKey.toLowerCase()] || sedesDeLaSheet[sedeKey] || { players: [] };
    const sheetConv = (sheetSedeData.players || [])
      .filter((p: any) => (p.estado || "").toUpperCase().includes("CONVOCADO"))
      .map((p: any) => (p.apodo || p.nombre || "").toLowerCase().trim());

    if (nativosConv.length !== sheetConv.length) {
      diferenciasEncontradas = true;
      reporte.push(`⚠️ Sede ${sedeKey}: Cantidad distinta (App: ${nativosConv.length}, Sheet: ${sheetConv.length})`);
    } else {
      const hayDiferencia = nativosConv.some((nombre, idx) => nombre !== sheetConv[idx]);
      if (hayDiferencia) {
        diferenciasEncontradas = true;
        reporte.push(`⚠️ Sede ${sedeKey}: Los nombres o el orden difieren.`);
      } else {
        reporte.push(`✅ Sede ${sedeKey}: ¡Coincide exactamente con la Sheet!`);
      }
    }
  });

  return {
    coincide: !diferenciasEncontradas,
    reporte,
    sedesNativas
  };
}
