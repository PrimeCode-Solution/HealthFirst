export interface BusinessHours{
    id: string;
    startTime: string;
    endTime: string;
    lunchStartTime?: string; 
    lunchEndTime?: string;
    lunchBreakEnabled: boolean;
    mondayEnabled: boolean;
    tuesdayEnabled: boolean;
    wednesdayEnabled: boolean;
    thursdayEnabled: boolean;
    fridayEnabled: boolean;
    saturdayEnabled: boolean;
    sundayEnabled: boolean;
    appointmentDuration: number;
}
//DTO para a criação de BusinessHours
export interface CreateBusinessHoursDTO{
    startTime: string;
    endTime: string;
    lunchStartTime?: string;
    lunchEndTime?: string;
    lunchBreakEnabled: boolean;

    //Dias da semana validos 
    mondayEnabled: boolean;
    tuesdayEnabled: boolean;
    wednesdayEnabled: boolean;
    thursdayEnabled: boolean;
    fridayEnabled: boolean;
    saturdayEnabled: boolean;
    sundayEnabled: boolean;
    appointmentDuration: number;
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
}
