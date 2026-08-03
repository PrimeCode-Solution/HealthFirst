/**
 * Regras de escala semanal por dia.
 *
 * A arquitetura antiga guardava um único par startTime/endTime em BusinessHours
 * aplicado a todos os dias habilitados. Agora cada dia da semana pode ter o seu
 * próprio horário (BusinessHoursDay). Os campos legados de BusinessHours seguem
 * existindo como fallback para médicos que ainda não migraram a configuração.
 *
 * dayOfWeek segue Date#getDay(): 0 = Domingo ... 6 = Sábado.
 */

export const WEEKDAYS = [
  { dayOfWeek: 0, label: "Domingo", short: "Dom", legacyKey: "sundayEnabled" },
  { dayOfWeek: 1, label: "Segunda-feira", short: "Seg", legacyKey: "mondayEnabled" },
  { dayOfWeek: 2, label: "Terça-feira", short: "Ter", legacyKey: "tuesdayEnabled" },
  { dayOfWeek: 3, label: "Quarta-feira", short: "Qua", legacyKey: "wednesdayEnabled" },
  { dayOfWeek: 4, label: "Quinta-feira", short: "Qui", legacyKey: "thursdayEnabled" },
  { dayOfWeek: 5, label: "Sexta-feira", short: "Sex", legacyKey: "fridayEnabled" },
  { dayOfWeek: 6, label: "Sábado", short: "Sáb", legacyKey: "saturdayEnabled" },
] as const;

// Ordem de exibição: a semana começa na segunda e o fim de semana fecha a lista.
export const WEEKDAYS_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const DEFAULT_APPOINTMENT_DURATION = 30;

export interface DayScheduleLike {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
  lunchBreakEnabled: boolean;
  lunchStartTime?: string | null;
  lunchEndTime?: string | null;
  appointmentDuration?: number | null;
}

export interface LegacyBusinessHoursLike {
  startTime: string;
  endTime: string;
  lunchBreakEnabled: boolean;
  lunchStartTime?: string | null;
  lunchEndTime?: string | null;
  appointmentDuration: number;
  mondayEnabled: boolean;
  tuesdayEnabled: boolean;
  wednesdayEnabled: boolean;
  thursdayEnabled: boolean;
  fridayEnabled: boolean;
  saturdayEnabled: boolean;
  sundayEnabled: boolean;
  days?: DayScheduleLike[] | null;
}

/** Escala efetiva de um dia, já com o fallback aplicado. */
export interface ResolvedDaySchedule {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
  lunchBreakEnabled: boolean;
  lunchStartTime: string | null;
  lunchEndTime: string | null;
  appointmentDuration: number;
}

export function timeToMinutes(hhmm: string): number {
  const [hh, mm] = hhmm.split(":").map(Number);
  return hh * 60 + mm;
}

export function minutesToTime(minutes: number): string {
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** Aceita "HH:mm" e também "HH:mm:ss" vindo do banco, normalizando para "HH:mm". */
export function normalizeTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[1]}:${match[2]}` : null;
}

function legacyDayEnabled(config: LegacyBusinessHoursLike, dayOfWeek: number): boolean {
  const key = WEEKDAYS[dayOfWeek]?.legacyKey;
  if (!key) return false;
  return Boolean(config[key as keyof LegacyBusinessHoursLike]);
}

/**
 * Resolve a escala de um dia: usa BusinessHoursDay quando existe, senão cai
 * para os campos globais legados de BusinessHours.
 */
export function resolveDaySchedule(
  config: LegacyBusinessHoursLike,
  dayOfWeek: number,
): ResolvedDaySchedule {
  const specific = config.days?.find((d) => d.dayOfWeek === dayOfWeek);

  if (specific) {
    return {
      dayOfWeek,
      enabled: specific.enabled,
      startTime: normalizeTime(specific.startTime) ?? config.startTime,
      endTime: normalizeTime(specific.endTime) ?? config.endTime,
      lunchBreakEnabled: specific.lunchBreakEnabled,
      lunchStartTime: normalizeTime(specific.lunchStartTime),
      lunchEndTime: normalizeTime(specific.lunchEndTime),
      appointmentDuration:
        specific.appointmentDuration ??
        config.appointmentDuration ??
        DEFAULT_APPOINTMENT_DURATION,
    };
  }

  return {
    dayOfWeek,
    enabled: legacyDayEnabled(config, dayOfWeek),
    startTime: normalizeTime(config.startTime) ?? "08:00",
    endTime: normalizeTime(config.endTime) ?? "18:00",
    lunchBreakEnabled: config.lunchBreakEnabled,
    lunchStartTime: normalizeTime(config.lunchStartTime),
    lunchEndTime: normalizeTime(config.lunchEndTime),
    appointmentDuration: config.appointmentDuration ?? DEFAULT_APPOINTMENT_DURATION,
  };
}

/** Resolve a semana inteira, em ordem de exibição (segunda → domingo). */
export function resolveWeekSchedule(
  config: LegacyBusinessHoursLike,
): ResolvedDaySchedule[] {
  return WEEKDAYS_DISPLAY_ORDER.map((dayOfWeek) =>
    resolveDaySchedule(config, dayOfWeek),
  );
}

/** Gera os horários iniciais ("HH:mm") de um dia, pulando o intervalo de almoço. */
export function generateDaySlots(day: ResolvedDaySchedule): string[] {
  if (!day.enabled) return [];

  const start = timeToMinutes(day.startTime);
  const end = timeToMinutes(day.endTime);
  const duration = day.appointmentDuration > 0 ? day.appointmentDuration : DEFAULT_APPOINTMENT_DURATION;

  if (!(end > start)) return [];

  const lunchStart =
    day.lunchBreakEnabled && day.lunchStartTime ? timeToMinutes(day.lunchStartTime) : null;
  const lunchEnd =
    day.lunchBreakEnabled && day.lunchEndTime ? timeToMinutes(day.lunchEndTime) : null;

  const slots: string[] = [];
  for (let current = start; current + duration <= end; current += duration) {
    const slotEnd = current + duration;
    // Descarta o slot se ele encostar em qualquer parte do almoço.
    const collidesWithLunch =
      lunchStart !== null && lunchEnd !== null && current < lunchEnd && slotEnd > lunchStart;

    if (!collidesWithLunch) slots.push(minutesToTime(current));
  }

  return slots;
}

export interface DayScheduleInput {
  dayOfWeek: number;
  enabled?: boolean;
  startTime?: string;
  endTime?: string;
  lunchBreakEnabled?: boolean;
  lunchStartTime?: string | null;
  lunchEndTime?: string | null;
  appointmentDuration?: number | null;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Valida a escala de um dia. Retorna a mensagem do primeiro erro, ou null.
 * Usado tanto na API quanto no formulário para manter as regras alinhadas.
 */
export function validateDaySchedule(day: DayScheduleInput): string | null {
  const label = WEEKDAYS[day.dayOfWeek]?.label ?? `Dia ${day.dayOfWeek}`;

  if (!Number.isInteger(day.dayOfWeek) || day.dayOfWeek < 0 || day.dayOfWeek > 6) {
    return `Dia da semana inválido: ${day.dayOfWeek}`;
  }

  if (!day.enabled) return null;

  if (!day.startTime || !TIME_PATTERN.test(day.startTime)) {
    return `${label}: horário de início inválido`;
  }
  if (!day.endTime || !TIME_PATTERN.test(day.endTime)) {
    return `${label}: horário de término inválido`;
  }

  const start = timeToMinutes(day.startTime);
  const end = timeToMinutes(day.endTime);
  if (end <= start) {
    return `${label}: o término deve ser depois do início`;
  }

  const duration = day.appointmentDuration ?? null;
  if (duration !== null && (duration < 5 || duration > 480)) {
    return `${label}: duração da consulta deve ficar entre 5 e 480 minutos`;
  }
  if (duration !== null && end - start < duration) {
    return `${label}: o expediente é menor que a duração de uma consulta`;
  }

  if (day.lunchBreakEnabled) {
    if (!day.lunchStartTime || !TIME_PATTERN.test(day.lunchStartTime)) {
      return `${label}: início do almoço inválido`;
    }
    if (!day.lunchEndTime || !TIME_PATTERN.test(day.lunchEndTime)) {
      return `${label}: fim do almoço inválido`;
    }
    const lunchStart = timeToMinutes(day.lunchStartTime);
    const lunchEnd = timeToMinutes(day.lunchEndTime);
    if (lunchEnd <= lunchStart) {
      return `${label}: o fim do almoço deve ser depois do início`;
    }
    if (lunchStart < start || lunchEnd > end) {
      return `${label}: o almoço precisa estar dentro do expediente`;
    }
  }

  return null;
}

/** Valida a semana inteira. Retorna a lista de erros encontrados. */
export function validateWeekSchedule(days: DayScheduleInput[]): string[] {
  const errors: string[] = [];
  const seen = new Set<number>();

  for (const day of days) {
    if (seen.has(day.dayOfWeek)) {
      errors.push(`Dia da semana duplicado: ${WEEKDAYS[day.dayOfWeek]?.label ?? day.dayOfWeek}`);
      continue;
    }
    seen.add(day.dayOfWeek);

    const error = validateDaySchedule(day);
    if (error) errors.push(error);
  }

  return errors;
}
