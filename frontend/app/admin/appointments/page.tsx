"use client";

import React, { useState, useEffect, useContext } from 'react';
import { Search, Eye } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '@/context/auth-context';
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Appointment {
  appointment_id: string;
  client_email: string;
  service_provider_email: string;
  date: string;
  time_from: string;
  time_to: string;
  note: string | null;
  // Additional fields from joins
  clientName?: string;
  clientImageUrl?: string;
  providerName?: string;
  providerImageUrl?: string;
  serviceName?: string;
  servicePrice?: string;
}

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const { isLoggedIn, user, isLoadingAuth } = useContext(AuthContext);

  const router = useRouter();

  useEffect(() => {
    if (isLoadingAuth) return; // Wait for auth status to be determined
  
    if (!isLoggedIn) {
      toast.info("Please log in", {
        description: "You are not logged in",
      });
      router.push("/admin");
    } else if (user?.role !== "admin") {
      toast.error("Unauthorized Access", {
        description: "You are not authorized to view this page",
      });
      router.push("/");
    }
  }, [isLoadingAuth, isLoggedIn, user]);
  


  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${baseURL}/appointments`);
      const validAppointments = response.data.filter(
        (appointment: Appointment) => appointment.client_email !== null
      );
      setAppointments(validAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };
  

  const filteredAppointments = appointments.filter(appointment => {
    const searchString = searchTerm.toLowerCase();
    return (
      (appointment.clientName?.toLowerCase() || '').includes(searchString) ||
      (appointment.providerName?.toLowerCase() || '').includes(searchString) ||
      (appointment.serviceName?.toLowerCase() || '').includes(searchString) ||
      (appointment.client_email?.toLowerCase() || '').includes(searchString) ||
      (appointment.service_provider_email?.toLowerCase() || '').includes(searchString)
    );
  });

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM:SS -> HH:MM
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">View all appointments</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search appointments by client, provider, or service..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium">Client</th>
                    <th className="text-left p-4 font-medium">Service Provider</th>
                    <th className="text-left p-4 font-medium">Service</th>
                    <th className="text-left p-4 font-medium">Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment.appointment_id} className="border-t hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            {appointment.clientImageUrl ? (
                              <img
                                src={appointment.clientImageUrl}
                                alt={appointment.clientName}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{appointment.clientName}</div>
                            <div className="text-sm text-gray-600">{appointment.client_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            {appointment.providerImageUrl ? (
                              <img
                                src={appointment.providerImageUrl}
                                alt={appointment.providerName}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{appointment.providerName}</div>
                            <div className="text-sm text-gray-600">{appointment.service_provider_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{appointment.serviceName}</div>
                        <div className="text-sm text-gray-600">{appointment.servicePrice}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{appointment.date}</div>
                        <div className="text-sm text-gray-600">
                          {formatTime(appointment.time_from)} - {formatTime(appointment.time_to)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredAppointments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No appointments found matching your criteria.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;