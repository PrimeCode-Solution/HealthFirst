import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/app/providers/prisma";
import { ProfileForm } from "@/components/profile/profile-form";
import { DashboardHeader } from "@/components/dashboard-header"; 

export const metadata: Metadata = {
  title: "Meu Perfil | HealthFirst",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      bio: true,
      specialty: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
      </div>
      
      <ProfileForm user={user} />
    </div>
  );
}