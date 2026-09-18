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

  let jugadores: PlayerProcessed[] = inscriptosCrudos.map((j) => {
    const mailTrim = j.email.toLowerCase().trim();
    // Si no está especificado en el registro de pagos, por defecto asumimos true, 
    // pero si config.pagosManuales lo marca en false, se respeta estrictamente.
    const pagoOk = config.pagosManuales[mailTrim] !== undefined ? config.pagosManuales[mailTrim] : true;
    
    let timestampNum = Date.now();
    if (j.timestamp) {
      const parsed = new Date(j.timestamp).getTime();
      if (!isNaN(parsed)) timestampNum = parsed;
    }

    let sedePref = "CANTON";
    const tUpper = (j.turno || "").toUpperCase();
    if (tUpper.includes("PUERTOS")) sedePref = "PUERTOS";
    else if (tUpper.includes("SM") || tUpper.includes("MATIAS")) sedePref = "SM";

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

  const bajasSet = new Set(config.bajasManuales.map(b => b.toLowerCase().trim()));
  jugadores = jugadores.filter(j => !bajasSet.has(j.nombre.toLowerCase().trim()));

  // =========================================================================
  // ORDEN DE PRIORIDAD ESTRICTA (IGUAL QUE EL APPS SCRIPT)
  // 1º: Los que pagaron (pagoAlDia: true) van antes que los que deben (false).
  // 2º: Los VIP van antes que los Generales.
  // 3º: Orden cronológico de inscripción (timestamp / orden de llegada).
  // =========================================================================
  jugadores.sort((a, b) => {
    if (a.pagoAlDia !== b.pagoAlDia) return a.pagoAlDia ? -1 : 1;
    if (a.esVip !== b.esVip) return a.esVip ? -1 : 1;
    if (a.timestamp === b.timestamp) return a.indice - b.indice;
    return a.timestamp - b.timestamp;
  });

  const hayLluvia = config.suspensionLluvia !== "SOL";
  if (hayLluvia) {
    jugadores = jugadores.filter(j => j.juegaConLluvia);
  }

  const sedes: Record<string, { activa: boolean; motivo: string; conv: PlayerProcessed[]; supl: PlayerProcessed[] }> = {};
  
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

  // Asignación inicial por preferencia y flexibilidad
  jugadores.forEach(jug => {
    let asignado = false;
    
    if (sedes[jug.pref] && sedes[jug.pref].activa && sedes[jug.pref].conv.length < reglasSedes[jug.pref]) {
      sedes[jug.pref].conv.push(jug);
      asignado = true;
    }
    
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
      if (sedes[jug.pref] && sedes[jug.pref].activa) {
        sedes[jug.pref].supl.push(jug);
      } else {
        let primeraActiva = ordenHojas.find(n => sedes[n].activa);
        if (primeraActiva) sedes[primeraActiva].supl.push(jug);
        else if (sedes[jug.pref]) sedes[jug.pref].supl.push(jug);
      }
    }
  });

  // Trueques para completar sedes incompletas usando jugadores flexibles
  ordenHojas.forEach(sedeIncompleta => {
    if (sedes[sedeIncompleta].activa) {
      let cupoTotal = reglasSedes[sedeIncompleta];
      let faltantes = cupoTotal - sedes[sedeIncompleta].conv.length;

      if (faltantes > 0) {
        let truequesDisponibles = 0;
        ordenHojas.forEach(otraSede => {
          if (otraSede !== sedeIncompleta && sedes[otraSede].activa) {
            let flexiblesEnConv = sedes[otraSede].conv.filter(j => j.flex).length;
            let suplentesEsperando = sedes[otraSede].supl.length;
            truequesDisponibles += Math.min(flexiblesEnConv, suplentesEsperando);
          }
        });

        if (truequesDisponibles >= faltantes) {
          while (sedes[sedeIncompleta].conv.length < cupoTotal) {
            let truequeRealizado = false;
            for (let i = 0; i < ordenHojas.length; i++) {
              let sedeLlena = ordenHojas[i];
              if (sedeLlena !== sedeIncompleta && sedes[sedeLlena].activa && sedes[sedeLlena].supl.length > 0) {
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
                  let suplentePromovido = sedes[sedeLlena].supl.shift()!;
                  sedes[sedeLlena].conv.push(suplentePromovido);
                  truequeRealizado = true;
                  break;
                }
              }
            }
            if (!truequeRealizado) break;
          }
        }
      }
    }
  });

  // Reordenamiento final por prioridad (los que deben pago siempre abajo)
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
