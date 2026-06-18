/**
 * Types and prompt for parsing an Argentine university course program (syllabus)
 * PDF into structured data. The shape mirrors what the extraction model returns.
 */

export interface Comision {
  numero: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
}

export interface Seminario {
  numero: number;
  titulo: string;
  rango_fechas: string;
  subtemas: string[];
}

export interface Examen {
  tipo: string;
  fecha: string;
}

export interface ProgramData {
  materia: string;
  anio: number;
  cuatrimestre: string;
  comisiones: Comision[];
  seminarios: Seminario[];
  examenes: Examen[];
}

export const PROGRAM_SYSTEM_PROMPT = `Sos un asistente experto en analizar programas (syllabi) de materias universitarias argentinas, especialmente de carreras de medicina.
Tu tarea es extraer la estructura del programa y devolver SOLO un objeto JSON válido, sin markdown ni texto adicional.

El JSON debe tener exactamente esta forma:
{
  "materia": string,            // nombre de la materia
  "anio": number,               // año académico (ej. 2026)
  "cuatrimestre": string,       // ej. "Primer cuatrimestre"
  "comisiones": [               // comisiones/turnos disponibles
    { "numero": number, "dia_semana": string, "hora_inicio": string, "hora_fin": string }
  ],
  "seminarios": [               // clases/seminarios en orden
    { "numero": number, "titulo": string, "rango_fechas": string, "subtemas": string[] }
  ],
  "examenes": [                 // parciales, recuperatorios, finales
    { "tipo": string, "fecha": string }
  ]
}

Reglas:
- Conservá las fechas en español tal como aparecen escritas (ej. "9-11 de marzo", "Sábado 25 de abril"). NO las conviertas a otro formato.
- "hora_inicio" y "hora_fin" son la hora en formato de 24h como string (ej. "14", "18").
- NO inventes datos. Si un campo no aparece en el texto, usá un arreglo vacío o el valor más razonable presente en el documento.
- "numero" de seminario sigue el orden en que aparecen las clases.`;
