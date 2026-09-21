import type { InscriptoSheet } from "@/lib/sheets.functions";

export interface VenueCapacity {
  [key: string]: number;
}

export interface EngineConfig {
  suspensionLluvia: string; // "SOL", "CANTON", "SM", "PUERTOS"
  suspensionOtra1: string;  // "NINGUNA", "CANTON", "SM", "PUERTOS"
  suspensionOtra2: string;  // "NINGUNA", "CANTON", "SM", "PUERTOS"
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

export interface SedeEstado {
  activa: boolean;
  motivo: string;
  conv: PlayerProcessed[];
  supl: PlayerProcessed[];
}

/**
 * Normaliza nombres de sedes para asegurar coincidencias con la Sheet
 */
export function normalizarSedeKey(cadena: string): string {
  if (!cadena) return "";
  const c = cadena.toUpperCase().trim();
  if (c.includes("CANTON") || c.includes("CANTÓN")) return "CANTON";
  if (c.includes("SM") || c.includes("MATIAS") || c.includes("MATÍAS")) return "SM";
  if (c.includes("PUERTOS")) return "PUERTOS";
  return c;
}

export function correrMotorConvocados(inscriptosCrudos: InscriptoSheet[], config: EngineConfig) {
  let ordenHojas = ["CANTON", "SM", "PUERTOS"];
  
  const reglasSedes: VenueCapacity = {
    "CANTON": 14,
    "SM": 16,
    "PUERTOS": config.puertos10vs10 ? 20 : 14
  };

  let indiceGeneral = 0;

  // 1. MAPEO INICIAL
  let jugadores: PlayerProcessed[] = inscriptosCrudos.map((j) => {
    const mailTrim = (j.email || "").toLowerCase().trim();
    const pagoOk = config.pagosManuales[mailTrim] !== undefined ? config.pagosManuales[mailTrim] : true;
    
    let timestampNum = Date.now();
    if (j.timestamp) {
      const parsed = new Date(j.timestamp).getTime();
      if (!isNaN(parsed)) timestampNum = parsed;
    }

    const sedePref = normalizarSedeKey(j.turno || j.sede || "CANTON");

    return {
      timestamp: timestampNum,
      indice: indiceGeneral++,
      pref: sedePref,
      flex: Boolean(j.flexible),
      nombre: (j.apodo || "").trim(),
      esVip: Boolean(j.vip),
      juegaConLluvia: Boolean(j.juega_con_lluvia),
      email: mailTrim,
      pagoAlDia: pagoOk
    };
  });

  // 2. FILTRADO DE BAJAS
  const bajasSet = new Set(config.bajasManuales.map(b => b.toLowerCase().trim()));
  jugadores = jugadores.filter(j => j.nombre !== "" && !bajasSet.has(j.nombre.toLowerCase()));

  // 3. ORDEN DE PRIORIDAD INDIVIDUAL
  jugadores.sort((a, b) => {
    if (a.pagoAlDia !== b.pagoAlDia) return a.pagoAlDia ? -1 : 1;
    if (a.esVip !== b.esVip) return a.esVip ? -1 : 1;
    if (a.timestamp === b.timestamp) return a.indice - b.indice;
    return a.timestamp - b.timestamp;
  });

  // 4. FILTRADO POR LLUVIA
  const susLluviaKey = normalizarSedeKey(config.suspensionLluvia);
  const hayLluvia = susLluviaKey !== "" && susLluviaKey !== "SOL";
  if (hayLluvia) {
    jugadores = jugadores.filter(j => j.juegaConLluvia);
  }

  // 5. ORDENAR SEDES POR DEMANDA DE JUGADORES
  const demandaSedes: Record<string, number> = {};
  ordenHojas.forEach(n => (demandaSedes[n] = 0));
  jugadores.forEach(jug => {
    if (demandaSedes[jug.pref] !== undefined) {
      demandaSedes[jug.pref]++;
    }
  });
  ordenHojas.sort((a, b) => demandaSedes[b] - demandaSedes[a]);

  // 6. DETECCIÓN DE CANCELACIONES
  const susOtra1Key = normalizarSedeKey(config.suspensionOtra1);
  const susOtra2Key = normalizarSedeKey(config.suspensionOtra2);

  const sedes: Record<string, SedeEstado> = {};
  ordenHojas.forEach(n => {
    sedes[n] = { activa: true, motivo: "", conv: [], supl: [] };
    if (hayLluvia && n === susLluviaKey) {
      sedes[n].activa = false;
      sedes[n].motivo = "CANCELADA POR LLUVIA";
    }
    if (susOtra1Key !== "NINGUNA" && susOtra1Key !== "" && n === susOtra1Key) {
      sedes[n].activa = false;
      sedes[n].motivo = "SEDE CANCELADA";
    }
    if (susOtra2Key !== "NINGUNA" && susOtra2Key !== "" && n === susOtra2Key) {
      sedes[n].activa = false;
      sedes[n].motivo = "SEDE CANCELADA";
    }
  });

  // 7. ASIGNACIÓN POR PRIORIDAD ESTRICTA
  jugadores.forEach(jug => {
    let asignado = false;
    
    // A. Intenta en su sede preferida
    if (sedes[jug.pref] && sedes[jug.pref].activa && sedes[jug.pref].conv.length < reglasSedes[jug.pref]) {
      sedes[jug.pref].conv.push(jug);
      asignado = true;
    }
    
    // B. Si es flexible y no entró a su preferida
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
    
    // C. Suplentes
    if (!asignado) {
      if (sedes[jug.pref] && sedes[jug.pref].activa) {
        sedes[jug.pref].supl.push(jug);
      } else {
        let primeraActiva = ordenHojas.find(n => sedes[n].activa);
        if (primeraActiva) {
          sedes[primeraActiva].supl.push(jug);
        } else if (sedes[jug.pref]) {
          sedes[jug.pref].supl.push(jug);
        }
      }
    }
  });

  // 8. OPTIMIZACIÓN (TRUEQUE CONDICIONADO A LLENAR LA SEDE)
  ordenHojas.forEach(sedeIncompleta => {
    if (sedes[sedeIncompleta].activa) {
      let cupoTotal = reglasSedes[sedeIncompleta];
      let anotados = sedes[sedeIncompleta].conv.length;
      let faltantes = cupoTotal - anotados;

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

  // 9. REORDENAMIENTO FINAL VISUAL POR PRIORIDAD
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
