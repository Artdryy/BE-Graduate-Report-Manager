/**
 * Formato canonico de las etiquetas de semestre.
 *
 * El frontend ordena los semestres con `sortSemesters` (src/utils/semesters.js):
 * toma el ultimo token separado por espacios como el año y busca "AGO" o "DIC"
 * en el texto anterior para decidir si es el segundo periodo. Cualquier otro
 * formato (por ejemplo "2025-2") hace que ambos semestres de un año empaten.
 *
 * Ambas etiquetas caben en `semester varchar(30)`:
 *   "Enero - Junio 2026"      -> 18 caracteres
 *   "Agosto - Diciembre 2026" -> 23 caracteres
 */
export const PERIODOS = Object.freeze({
  PRIMERO: 'Enero - Junio',
  SEGUNDO: 'Agosto - Diciembre',
});

export function buildSemesterLabel(periodo, anio) {
  return `${periodo} ${anio}`;
}

/** Las dos etiquetas de semestre de un año dado. */
export function semestersForYear(anio) {
  return [
    buildSemesterLabel(PERIODOS.PRIMERO, anio),
    buildSemesterLabel(PERIODOS.SEGUNDO, anio),
  ];
}

/** Las dos etiquetas del año en curso. */
export function currentYearSemesters(now = new Date()) {
  return semestersForYear(now.getFullYear());
}
