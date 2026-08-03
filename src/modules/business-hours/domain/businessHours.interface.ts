// Horário específico de um dia da semana.
// dayOfWeek segue Date#getDay(): 0 = Domingo ... 6 = Sábado.
export interface BusinessHoursDay {
    id: string;
    dayOfWeek: number;
    enabled: boolean;
    startTime: string;
    endTime: string;
    lunchBreakEnabled: boolean;
    lunchStartTime?: string | null;
    lunchEndTime?: string | null;
    // Sobrescreve a duração global quando preenchido
    appointmentDuration?: number | null;
}

export interface BusinessHours{
    id: string;
    // Campos globais mantidos como fallback para dias sem registro específico
    startTime: string;
    endTime: string;
    lunchStartTime?: string | null;
    lunchEndTime?: string | null;
    lunchBreakEnabled: boolean;
    mondayEnabled: boolean;
    tuesdayEnabled: boolean;
    wednesdayEnabled: boolean;
    thursdayEnabled: boolean;
    fridayEnabled: boolean;
    saturdayEnabled: boolean;
    sundayEnabled: boolean;
    appointmentDuration: number;
    // Escala por dia da semana
    days: BusinessHoursDay[];
}

// Payload de um dia enviado pelo formulário
export interface BusinessHoursDayDTO{
    dayOfWeek: number;
    enabled: boolean;
    startTime: string;
    endTime: string;
    lunchBreakEnabled?: boolean;
    lunchStartTime?: string | null;
    lunchEndTime?: string | null;
    appointmentDuration?: number | null;
}

//DTO para a criação de BusinessHours
export interface CreateBusinessHoursDTO{
    startTime: string;
    endTime: string;
    lunchStartTime?: string;
    lunchEndTime?: string;
    lunchBreakEnabled?: boolean;

    //Dias da semana validos
    mondayEnabled?: boolean;
    tuesdayEnabled?: boolean;
    wednesdayEnabled?: boolean;
    thursdayEnabled?: boolean;
    fridayEnabled?: boolean;
    saturdayEnabled?: boolean;
    sundayEnabled?: boolean;
    appointmentDuration: number;

    //Escala específica por dia da semana
    days?: BusinessHoursDayDTO[];
}

//DTIO para a atualização de BusinessHours
export interface UpdateBusinessHoursDTO{
    startTime?: string;
    endTime?: string;
    lunchStartTime?: string;
    lunchEndTime?: string;
    lunchBreakEnabled?: boolean;

    //Atualização dos dias da semana
    mondayEnabled?:boolean;
    tuesdayEnabled?: boolean;
    wednesdayEnabled?: boolean;
    thursdayEnabled?: boolean;
    fridayEnabled?: boolean;
    saturdayEnabled?: boolean;
    sundayEnabled?: boolean;
    appointmentDuration?: number;

    //Escala específica por dia da semana (substitui a semana inteira quando enviado)
    days?: BusinessHoursDayDTO[];
}
