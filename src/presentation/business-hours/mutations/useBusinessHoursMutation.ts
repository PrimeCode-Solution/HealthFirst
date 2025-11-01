import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBusinessHoursRepository } from "@/modules/business-hours/infrastructure/businessHoursRepository";
import { toast } from "sonner";
import type {
    UpdateBusinessHoursDTO,
    BusinessHours,
} from "@/modules/business-hours/domain/businessHours.interface";
import { AxiosError } from "axios";

const businessHoursRepository = createBusinessHoursRepository();

// Tipagem para os campos dos dias da semana do DTO
type DaysOfWeekField =
    | "mondayEnabled"
    | "tuesdayEnabled"
    | "wednesdayEnabled"
    | "thursdayEnabled"
    | "fridayEnabled"
    | "saturdayEnabled"
    | "sundayEnabled";

// Hook para atualizar horário de funcionamento
export function useUpdateBusinessHours() {
    const queryClient = useQueryClient();

    return useMutation({
    mutationFn: ({
        id,
        data,
    }: {
        id: string;
        data: UpdateBusinessHoursDTO;
    }) => businessHoursRepository.update(id, data),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["businessHours"] });
        toast.success("Horário atualizado com sucesso!");
    },
    onError: (error: AxiosError) => {
        console.error("Erro ao atualizar horário:", error);
        toast.error(error.message || "Erro ao atualizar horário");
    },
    });
}

// Hook para alternar disponibilidade de dia da semana
export function useToggleDayAvailability() {
    const queryClient = useQueryClient();

    return useMutation({
    mutationFn: ({
        id,
        day,
        enabled,
    }: {
        id: string;
        day: DaysOfWeekField;
        enabled: boolean;
    }) => businessHoursRepository.update(id, { [day]: enabled }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["businessHours"] });
        toast.success("Disponibilidade atualizada com sucesso!");
    },
    onError: (error: AxiosError) => {
        console.error("Erro ao alterar disponibilidade:", error);
        toast.error(error.message || "Erro ao alterar disponibilidade");
    },
    });
}

// Hook para atualizar intervalo de almoço
export function useUpdateLunchBreak() {
    const queryClient = useQueryClient();

    return useMutation({
    mutationFn: ({
        id,
        lunchBreakEnabled,
        lunchStartTime,
        lunchEndTime,
    }: {
        id: string;
        lunchBreakEnabled: boolean;
        lunchStartTime?: string;
        lunchEndTime?: string;
    }) =>
        businessHoursRepository.update(id, {
        lunchBreakEnabled,
        lunchStartTime,
        lunchEndTime,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["businessHours"] });
        toast.success("Intervalo de almoço atualizado com sucesso!");
    },
    onError: (error: AxiosError) => {
        console.error("Erro ao atualizar intervalo de almoço:", error);
        toast.error(error.message || "Erro ao atualizar intervalo de almoço");
    },
    });
}
