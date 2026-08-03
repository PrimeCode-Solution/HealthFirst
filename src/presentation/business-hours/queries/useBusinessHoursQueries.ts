import { useQuery} from "@tanstack/react-query";
import { createBusinessHoursRepository} from "@/modules/business-hours/infrastructure/businessHoursRepository";

const businessHoursRepository = createBusinessHoursRepository();
//Hook para busca de BusinessHours por id
export function useBusinessHoursById(id: string | undefined){
    return useQuery({
        queryKey: ["businessHours", id],
        queryFn: () => businessHoursRepository.findById(id ?? ""),
        enabled: !!id,
    });
}
//Hook para os horários livres de um médico numa data (recebe o id do MÉDICO)
export function useAvailableSlots(doctorId: string | undefined, date: Date | undefined){
    return useQuery({
        queryKey: ["businessHoursSlots", doctorId, date?.toISOString().slice(0, 10)],
        queryFn: () => (doctorId && date) ? businessHoursRepository.getAvailableSlots(doctorId, date): [],
        enabled: !!doctorId && !!date
    })
}