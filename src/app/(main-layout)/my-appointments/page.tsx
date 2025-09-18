import { MyAppointments } from '@/components/appointment-booking/MyAppointments';
import { AppointmentBookingProvider } from '@/lib/contexts/AppointmentBookingContext';

export default function MyAppointmentsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Lịch hẹn của tôi
          </h1>
          <p className="text-lg text-gray-600">
            Quản lý và theo dõi các lịch hẹn khám bệnh
          </p>
        </div>
        <AppointmentBookingProvider>
          <MyAppointments />
        </AppointmentBookingProvider>
      </div>
    </div>
  );
}
