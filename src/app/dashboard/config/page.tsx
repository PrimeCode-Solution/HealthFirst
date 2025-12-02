"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UpdateUserForm } from "@/presentation/user/Update/UpdateUserForm";
import { ScheduleManager } from "@/components/config/schedule-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User as UserIcon, Loader2 } from "lucide-react";
import { useGetUserById } from "@/presentation/user/queries/useUserQueries";
import { toast } from "sonner";

export default function ConfigPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id ?? "";

  const { data: user, isLoading, refetch } = useGetUserById(userId);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || !session.user) return null;

  const isDoctorOrAdmin = session.user.role === "ADMIN" || session.user.role === "DOCTOR";

  const handleProfileSuccess = () => {
    toast.success("Perfil atualizado com sucesso!"); 
    refetch(); 
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-muted-foreground">Gerencie seu perfil e preferências.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="profile">Meu Perfil</TabsTrigger>
          {isDoctorOrAdmin && <TabsTrigger value="schedule">Agenda & Horários</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" /> Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <UpdateUserForm user={user} onSuccess={handleProfileSuccess} />
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                   <p className="text-muted-foreground mb-2">Não foi possível carregar os dados.</p>
                   <button onClick={() => refetch()} className="text-primary hover:underline text-sm">
                     Tentar novamente
                   </button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isDoctorOrAdmin && (
          <TabsContent value="schedule">
             <ScheduleManager />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}