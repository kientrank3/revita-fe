"use client";

import { useMemo } from 'react';
import { ChartStatisticsCards, ChartDetailedStatisticsCards } from "@/components/dashboard/ChartStatisticsCards";
import { ChartRevenueStatistics, ChartPaymentMethodStatistics } from "@/components/dashboard/ChartRevenueStatistics";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import { ChartAdvancedStatistics } from "@/components/dashboard/ChartAdvancedStatistics";
import { useDashboardStatistics, usePeriodSelection } from "@/lib/hooks/use-statistics";
import { 
  useRevenueStatistics, 
  useWorkSessionStatistics, 
  useExaminationVolumeStatistics, 
  useTopServicesStatistics,
  usePaymentMethodStatistics
} from "@/lib/hooks/use-statistics";
import { PeriodType } from "@/lib/types/statistics";
import { useAuth } from "@/lib/hooks/useAuth";

export function DashboardClient() {
  const { user } = useAuth();
  const userRole = user?.role;

  const {
    period,
    customStartDate,
    customEndDate,
    handlePeriodChange,
    handleCustomDateChange,
    getCurrentParams
  } = usePeriodSelection('day');

  const params = useMemo(() => getCurrentParams(), [getCurrentParams]);
  
  // Debug: Log params changes
  console.log('DashboardClient params:', params);
  console.log('DashboardClient period:', period);
  console.log('DashboardClient customStartDate:', customStartDate);
  console.log('DashboardClient customEndDate:', customEndDate);
  
  // Check if user can view KPI stats
  const canViewKPI = ['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(userRole || '');
  
  // Role-based data fetching - only call APIs if user has permission
  const dashboardStats = useDashboardStatistics(
    params.period as PeriodType, 
    params.startDate, 
    params.endDate,
    canViewKPI
  );
  
  // Revenue stats - only for ADMIN and CASHIER
  const revenueStats = useRevenueStatistics(
    params.period as PeriodType, 
    params.startDate, 
    params.endDate,
    ['ADMIN', 'CASHIER'].includes(userRole || '')
  );
  
  // Payment method stats - only for ADMIN and CASHIER
  const paymentStats = usePaymentMethodStatistics(
    params.period as PeriodType, 
    params.startDate, 
    params.endDate,
    ['ADMIN', 'CASHIER'].includes(userRole || '')
  );
  
  // Work session stats - for ADMIN, RECEPTIONIST, DOCTOR, TECHNICIAN
  const workSessionStats = useWorkSessionStatistics(
    params.period as PeriodType, 
    params.startDate, 
    params.endDate,
    ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'TECHNICIAN'].includes(userRole || '')
  );
  
  // Examination volume stats - for ADMIN, RECEPTIONIST, DOCTOR
  const examinationStats = useExaminationVolumeStatistics(
    params.period as PeriodType, 
    params.startDate, 
    params.endDate,
    ['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(userRole || '')
  );
  
  // Top services stats - for ADMIN and RECEPTIONIST
  const topServicesStats = useTopServicesStatistics(
    params.period as PeriodType, 
    params.startDate, 
    params.endDate,
    ['ADMIN', 'RECEPTIONIST'].includes(userRole || '')
  );

  // Check permissions
  const canViewRevenue = ['ADMIN', 'CASHIER'].includes(userRole || '');
  const canViewPaymentMethods = ['ADMIN', 'CASHIER'].includes(userRole || '');
  const canViewWorkSessions = ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'TECHNICIAN'].includes(userRole || '');
  const canViewExaminationVolume = ['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(userRole || '');
  const canViewTopServices = ['ADMIN', 'RECEPTIONIST'].includes(userRole || '');

  return (
    <>
      {/* Period Selector */}
      <PeriodSelector
        period={period}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onPeriodChange={handlePeriodChange}
        onCustomDateChange={handleCustomDateChange}
        loading={dashboardStats.loading}
      />

      {/* KPI Statistics - Available for ADMIN, RECEPTIONIST, DOCTOR */}
      {canViewKPI && (
        <>
          {/* Main Statistics Cards */}
          <ChartStatisticsCards
            data={dashboardStats.kpi.data}
            loading={dashboardStats.loading}
            error={dashboardStats.error}
          />

          {/* Detailed Statistics Cards */}
          <ChartDetailedStatisticsCards
            data={dashboardStats.kpi.data}
            loading={dashboardStats.loading}
            error={dashboardStats.error}
            period={params.period}
            startDate={params.startDate}
            endDate={params.endDate}
          />
        </>
      )}

      {/* Revenue Statistics - Only for ADMIN and CASHIER */}
      {canViewRevenue && (
        <ChartRevenueStatistics
          data={revenueStats.data}
          loading={revenueStats.loading}
          error={revenueStats.error}
        />
      )}

      {/* Payment Method Statistics - Only for ADMIN and CASHIER */}
      {canViewPaymentMethods && (
        <ChartPaymentMethodStatistics
          data={paymentStats.data}
          loading={paymentStats.loading}
          error={paymentStats.error}
        />
      )}

      {/* Advanced Statistics - Role-based tabs */}
      {(canViewWorkSessions || canViewExaminationVolume || canViewTopServices) && (
        <ChartAdvancedStatistics
          workSessionData={workSessionStats.data}
          examinationData={examinationStats.data}
          topServicesData={topServicesStats.data}
          patientSpendingData={null} // Patient spending moved to main-layout
          loading={workSessionStats.loading || examinationStats.loading || topServicesStats.loading}
          error={workSessionStats.error || examinationStats.error || topServicesStats.error}
          userRole={userRole}
          period={params.period}
          startDate={params.startDate}
          endDate={params.endDate}
        />
      )}

    </>
  );
}
