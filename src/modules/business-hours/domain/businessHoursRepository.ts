import{
    BusinessHours,
    CreateBusinessHoursDTO,
    UpdateBusinessHoursDTO,
} from "./businessHours.interface";

export interface BusinessHoursRepository{
    //Criar novo registro de BusinessHours com do DTO de criação
    create(data: CreateBusinessHoursDTO): Promise<BusinessHours>;
    //Atualizar o registro existente identificado pelo id, com os dados do DTO de atualizção
    update(id: string, data: UpdateBusinessHoursDTO): Promise<BusinessHours | null>;
    //Buscar um registro de BusinessHours pelo id, retornar null se não encontrado
    findById(id: string): Promise<BusinessHours | null>;
    //Buscar todos os registros 
    findAll(): Promise<BusinessHours[]>;
    //Deletar um registro pelo id, retorna true se exluído, false se não encontrado 
    delete(id: string): Promise<boolean>;
    getAvailableSlots(id: string, date: Date): Promise<string[]>;
}