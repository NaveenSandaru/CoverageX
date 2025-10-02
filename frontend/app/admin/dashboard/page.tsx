"use client";
import React, { useState, useEffect, useContext } from "react";
import {
  Users,
  UserCheck,
  Calendar,
} from "lucide-react";
import { AuthContext } from "@/context/auth-context";
import axios from "axios";
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
  clientName?: string;
  clientImageUrl?: string;
  providerName?: string;
  providerImageUrl?: string;
  serviceName?: string;
  servicePrice?: string;
}

interface ServiceProvider {
  email: string;
  name: string;
  phone_number: string;
  profile_picture: string | null;
  company_name: string;
  company_address: string;
  company_phone_number: string;
  language: string;
  service_type: string;
  specialization: string | null;
  work_days_from: string;
  work_days_to: string;
  work_hours_from: string;
  work_hours_to: string;
  appointment_duration: string;
  appointment_fee: number;
}

interface Client {
  email: string;
  name: string;
  phone_number: string;
  profile_picture: string | null;
  age?: number;
  gender?: "M" | "F";
  address?: string;
}

const Dashboard = () => {
  const { isLoggedIn, user, isLoadingAuth } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const router = useRouter();

  const [stats, setStats] = useState({
    totalProviders: 0,
    totalClients: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    totalRevenue: 0,
    avgRating: 4.7,
  });

  const [recentActivity, setRecentActivity] = useState([]);

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
    if (user != null) {
      const loadData = async () => {
        try {
          setIsLoading(true);

          const [appointmentsRes, providersRes, clientsRes] = await Promise.all([
            axios.get(`${baseURL}/appointments`),
            axios.get(`${baseURL}/service-providers`),
            axios.get(`${baseURL}/clients`),
          ]);

          const validAppointments = appointmentsRes.data.filter(
            (a: Appointment) => a.client_email !== null
          );

          setAppointments(validAppointments);
          setProviders(providersRes.data);
          setClients(clientsRes.data);

          const totalRevenue = validAppointments.reduce((sum, appt) => {
            return sum + (Number(appt.servicePrice) || 0);
          }, 0);

          const pendingAppointments = 12; // Replace with actual status filter if available
          const completedAppointments = validAppointments.length - pendingAppointments;

          setStats({
            totalProviders: providersRes.data.length,
            totalClients: clientsRes.data.length,
            totalAppointments: validAppointments.length,
            pendingAppointments,
            completedAppointments,
            totalRevenue,
            avgRating: 4.7,
          });

          const recent = [];

          const latestAppt = [...validAppointments].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];
          if (latestAppt) {
            recent.push({
              id: 1,
              type: "appointment",
              message: `New appointment booked by ${latestAppt.client_email}`,
              time: `${latestAppt.date} ${latestAppt.time_from}`,
              status: "success",
            });
          }

          const latestClient = clientsRes.data[clientsRes.data.length - 1];
          if (latestClient) {
            recent.push({
              id: 2,
              type: "client",
              message: `New client ${latestClient.email} registered`,
              time: "Recently",
              status: "success",
            });
          }

          const latestProvider = providersRes.data[providersRes.data.length - 1];
          if (latestProvider) {
            recent.push({
              id: 3,
              type: "provider",
              message: `${latestProvider.name} joined as provider`,
              time: "Recently",
              status: "info",
            });
          }

          setRecentActivity(recent);
        } catch (error) {
          console.error("Error loading dashboard data", error);
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
    }
  }, [user]);

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon
          className={`w-8 h-8 ${color.replace("text-", "text-").replace(
            "-600",
            "-500"
          )}`}
        />
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const statusColors = {
      success: "bg-green-500",
      info: "bg-blue-500",
      warning: "bg-yellow-500",
      error: "bg-red-500",
    };

    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
        <div
          className={`w-2 h-2 rounded-full ${statusColors[activity.status]}`}
        ></div>
        <span className="text-sm text-gray-700 flex-1">{activity.message}</span>
        <span className="text-xs text-gray-500">{activity.time}</span>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen overflow-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here's what's happening with your appointment system.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Service Providers"
          value={stats.totalProviders}
          icon={UserCheck}
          color="text-blue-600"
        />
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          icon={Users}
          color="text-green-600"
        />
        <StatCard
          title="Total Appointments"
          value={stats.totalAppointments}
          icon={Calendar}
          color="text-purple-600"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
