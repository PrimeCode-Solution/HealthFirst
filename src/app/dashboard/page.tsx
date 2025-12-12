"use client";

import { useSession } from "next-auth/react";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { DoctorDashboard } from "@/components/dashboard/doctor-dashboard";
import { PatientDashboard } from "@/components/dashboard/patient-dashboard";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-full w-full items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  switch (session.user.role) {
      case "ADMIN":
          return <AdminDashboard />;
      case "DOCTOR":
          return <DoctorDashboard />
      case "USER":
          return <PatientDashboard />
      default:
          return <div>Role de usuário inválida!</div>;
  }

}
