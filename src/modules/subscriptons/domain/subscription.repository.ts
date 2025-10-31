import {Subscription, CreateSubscriptionDTO, UpdateSubscriptionDTO} from './subscription.interface';
export interface ISubscriptionRepository{
    create(data: CreateSubscriptionDTO): Promise<Subscription>;
    update(id: string, data: UpdateSubscriptionDTO): Promise<Subscription>;
    findById(id: string): Promise<Subscription | null>;
    findAll(): Promise<Subscription[]>;
    delete(id: string): Promise<void>;
}