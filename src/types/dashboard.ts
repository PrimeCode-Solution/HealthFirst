export interface DashboardStats {
    overview: {
      totalPatients: number;
      totalAppointments: number;
      totalRevenue: number;
    };
    charts: {
      revenueByMonth: Array<{
        month: string;
        revenue: number;
      }>;
      appointmentsByStatus: Array<{
        status: string;
        count: number;
      }>;
    };
  }