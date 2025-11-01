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
export function useAvailableSlots(id: string | undefined, date: Date | undefined){
    return useQuery({
        queryKey: ["businessHoursSlots", id, date?.toISOString().slice(0, 10)],
        queryFn: () => (id && date) ? businessHoursRepository.getAvailableSlots(id, date): [],
        enabled: !!id && !!date
    })
}