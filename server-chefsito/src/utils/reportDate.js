export const REPORT_TIMEZONE = 'America/Mexico_City'

/** Fecha de reporte YYYY-MM-DD en horario de México (Guadalajara/CDMX). */
export function getReportDate(reference = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: REPORT_TIMEZONE }).format(reference)
}
