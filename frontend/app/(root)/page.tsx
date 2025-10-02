"use client"

import React, { use, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ServiceCard } from '@/Components/serviceCard'
import { BookingCard } from '@/Components/BookingCard'
import { AuthContext } from '@/context/auth-context';
import { useContext, useEffect } from 'react';
import Link from 'next/link'
import axios from 'axios'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'


export default function Home() {

  const { isLoggedIn, user } = useContext(AuthContext);

  const [retrievedServices, setRetrievedServices] = useState<Service[] | null>(null);
  const [retrievedAppointments, setRetrievedAppointments] = useState<Appointment[] | null>(null);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const router = useRouter();


  const getFeaturedServices = async () => {
    try {
      setIsLoadingServices(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/services`
      );

      if (response.data) {
        setRetrievedServices(response.data.data);
      }
      else {
        throw new Error("No services found");
      }
    }
    catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to fetch services"
      });
    }
    finally {
      setIsLoadingServices(false);
    }
  }

  const getAppointments = async () => {
    try {
      setIsLoadingAppointments(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/appointments/client/${user.email}`
      );

      const enrichedAppointments = await Promise.all(
        response.data.map(async (appointment: Appointment) => {
          let providerName = '';
          let providerAvatar = '';
          let serviceName = '';

          try {
            const providerRes = await axios.get(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/service-providers/sprovider/${appointment.service_provider_email}`
            );
            const provider = providerRes.data;
            providerName = provider.name;
            providerAvatar = provider.profile_picture?.startsWith("/uploads")
              ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${provider.profile_picture}`
              : provider.profile_picture || "";


            const serviceRes = await axios.get(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/services/${provider.service_type}`
            );
            serviceName = serviceRes.data.data.service;
          } catch (err) {
            console.error("Failed to enrich appointment", err);
          }

          return {
            ...appointment,
            providerName,
            providerAvatar,
            serviceName,
          };
        })
      );

      setRetrievedAppointments(enrichedAppointments);
      console.log(enrichedAppointments);
    }
    catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to fetch appointments"
      });
    }
    finally {
      setIsLoadingAppointments(false);
    }
  };

  useEffect(() => {
    if (user) {
      getAppointments();
      if(user.role=="sp"){
        router.push("/serviceproviderdashboard");
      }
      else if(user.role == "admin"){
        router.push("/admin/dashboard");
      }
      else if(user.role == "client"){
        return;
      }
      else{
        toast.error("Error authenticating user");
      }
    }
  }, [user]);

  useEffect(()=>{
    getFeaturedServices();
  },[])

  type Service = {
    service_id: string;
    service: string;
    description: string;
    picture: string
  };

  type Appointment = {
    appointment_id: string;
    client_email: string;
    service_provider_email: string;
    date: string;
    time_from: string;
    time_to: string;
    note: string;
    providerName: string;
    providerAvatar: string;
    serviceName: string
  };

  const handleAppointmentCancel = (appointmentId: string) => {
    setRetrievedAppointments((prevAppointments) => 
      prevAppointments?.filter(appointment => appointment.appointment_id !== appointmentId) || null
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gap between navbar and hero section */}
      <div className="h-6 bg-gray-50"></div>

      {/* Header/Hero Section */}
      <div className="bg-gradient-to-r from-[#2563EB]/10 to-[#0891B2]/20 px-6 py-8 mx-6 rounded-3xl mb-8 md:max-w-7xl md:mx-auto">
        <div className="max-w-6xl mx-auto">
          {isLoggedIn ?
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user.name.split(" ")[0]}
            </h1>
            :
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome!
            </h1>
          }
          <p className="text-gray-600 mb-6">
            Find and book the services you need from our trusted providers.
          </p>
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              type="text"
              placeholder="Search for services, providers, or categories..."
              className="pl-10 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        {/* Featured Services */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Featured Services</h2>
            <Link href="/services"><button className="text-[#6B7280] hover:text-[#6B7280]/80 text-sm">View all</button></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingServices ? (
              <p>Loading...</p>
            ) : retrievedServices && retrievedServices.length > 0 ? (
              retrievedServices.slice(0, 3).map((retrievedService: Service) => (
                <div key={retrievedService.service_id} className="flex">
                  <ServiceCard
                    serviceId={retrievedService.service_id}
                    service={retrievedService.service}
                    description={retrievedService.description}
                    image={retrievedService.picture?.includes('/uploads')
                      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${retrievedService.picture}`
                      : retrievedService.picture}
                  />
                </div>
              ))
            ) : (
              <p>No services available</p>
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Recent Bookings</h2>
            <button className="text-[#6B7280] hover:text-[#6B7280]/80 text-sm">View all</button>
          </div>
          <Card>
            <CardContent className="p-0">
              {isLoadingAppointments ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading bookings...</p>
                  </div>
                </div>
              ) : retrievedAppointments && retrievedAppointments.length > 0 ? (
                retrievedAppointments.map((appointment) => (
                  <BookingCard
                    key={appointment.appointment_id}
                    appointmentId={appointment.appointment_id}
                    serviceProviderEmail={appointment.service_provider_email}
                    date={appointment.date}
                    timeFrom={appointment.time_from}
                    timeTo={appointment.time_to}
                    note={appointment.note}
                    providerName={appointment.providerName || "Unknown"}
                    providerAvatar={appointment.providerAvatar || ""}
                    serviceName={appointment.serviceName || "Unknown"}
                    onCancel={handleAppointmentCancel}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  {/* Calendar Icon */}
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>

                  {/* Message */}
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recent bookings</h3>
                  <p className="text-gray-500 mb-6 max-w-sm">
                    You haven't booked any services yet. Explore our featured services to get started.
                  </p>

                  {/* Call-to-action Button */}

                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}