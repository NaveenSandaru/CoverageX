"use client";

import React, { useState, useEffect, use, useContext } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, Search, MapPin, Clock, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { AuthContext } from '@/context/auth-context';
import { toast } from "sonner";


interface ServiceProviderPageProps {
  params: Promise<{ service_type: string }>;
}

export default function ServiceProviderPage({ params }: ServiceProviderPageProps) {

  const { isLoggedIn, user } = useContext(AuthContext);

  const [providers, setProviders] = useState<any[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Unwrap the params Promise
  const unwrappedParams = use(params);

  const getProviders = async () => {
    setLoading(true);
    try {
      const decodedServiceType = decodeURIComponent(unwrappedParams.service_type);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/service-providers/by_type/${decodedServiceType}`
      );
      if (response.data) {
        setProviders(response.data);
      }
    }
    catch (error: any) {
      toast.error("Failed to load providers", {
        description: error.message
      });
    }
    finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getProviders();
  }, [unwrappedParams.service_type]);

  // Filter providers based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProviders(providers);
    } else {
      const filtered = providers.filter((provider) =>
        provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.company_address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProviders(filtered);
    }
  }, [searchQuery, providers]);

  const handleBookAppointment = (provider: any) => {
    if(!isLoggedIn){
      toast.error("Authentication Required", {
        description: "Please log in to book an appointment"
      });
      return;
    }
    router.push(`/book/${encodeURIComponent(provider.email)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <p className="text-gray-600">Loading providers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, clinic, specialty, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Top Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
          <select className="border border-gray-300 p-2 rounded text-sm text-gray-600 bg-white w-full sm:w-auto">
            <option>Select Speciality</option>
          </select>
          <div className="flex items-center justify-center gap-2 border border-gray-300 p-2 rounded text-sm text-gray-600 bg-white cursor-pointer w-full sm:w-auto">
            <span>Filtering options</span>
            <Filter className="w-4 h-4" />
          </div>
        </div>

        {/* Results Counter */}
        {searchQuery && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} found for "{searchQuery}"
            </p>
          </div>
        )}

        {/* Provider Cards */}
        <div className="space-y-3 sm:space-y-4">
          {filteredProviders.map((provider, index) => (
            <Card
              key={`${provider.email}-${index}`}
              className="bg-white border border-gray-200 hover:shadow-md transition-shadow"
            >
              {/* Mobile Layout */}
              <div className="block sm:hidden p-4">
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${provider.profile_picture}`}
                    alt={provider.name}
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base mb-1">
                      {provider.name}
                    </h3>
                    <p className="text-sm text-emerald-600 font-semibold mb-1">
                      {provider.specialty}
                    </p>
                    <p className="text-sm text-gray-600 font-medium mb-1">
                      {provider.company_name}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{provider.company_address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {provider.work_days_from.charAt(0).toUpperCase() + provider.work_days_from.slice(1)} to{" "}{provider.work_days_to.charAt(0).toUpperCase() + provider.work_days_to.slice(1)},
                      {provider.work_hours_from - provider.work_hours_to}
                    </span>

                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 flex-shrink-0" />
                    <span>Appointment Fee: ${provider.appointment_fee}</span>
                  </div>
                </div>

                <Button
                  onClick={() => handleBookAppointment(provider)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white w-full py-2 text-sm"
                >
                  Book Now
                </Button>
              </div>

              {/* Desktop/Tablet Layout */}
              <div className="hidden sm:flex items-center p-4 lg:p-6">
                {/* Profile Image */}
                <div className="flex-shrink-0 mr-4 lg:mr-6">
                  <img
                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${provider.profile_picture}`}
                    alt={provider.name}
                    className="w-12 h-12 lg:w-16 lg:h-16 rounded-full object-cover"
                  />
                </div>

                {/* Provider Info */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6 items-center">
                  {/* Name, Company and Specialty */}
                  <div className="md:col-span-1">
                    <h3 className="font-semibold text-gray-900 text-sm lg:text-base mb-1">
                      {provider.name}
                    </h3>
                    <p className="text-sm lg:text-base text-emerald-600 font-semibold mb-1">
                      {provider.specialty}
                    </p>
                    <p className="text-sm text-gray-600 font-medium mb-1">
                      {provider.company_name}
                    </p>
                    <p className="text-xs lg:text-sm text-gray-600">
                      Appointment Fee: ${provider.appointment_fee}
                    </p>
                  </div>

                  {/* Address */}
                  <div className="md:col-span-1">
                    <div className="flex items-start gap-2 text-xs lg:text-sm text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{provider.company_address}</span>
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="md:col-span-1">
                    <div className="flex items-start gap-2 text-xs lg:text-sm text-gray-600">
                      <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <p>
                          {provider.work_days_from.charAt(0).toUpperCase() + provider.work_days_from.slice(1)} to{" "}
                          {provider.work_days_to.charAt(0).toUpperCase() + provider.work_days_to.slice(1)}
                        </p>

                        <p>
                          {provider.work_hours_from} - {provider.work_hours_to}
                        </p>

                      </div>
                    </div>
                  </div>

                  {/* Book Now Button */}
                  <div className="md:col-span-1 md:text-right">
                    <Button
                      onClick={() => handleBookAppointment(provider)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 lg:px-6 py-2 text-xs lg:text-sm w-full md:w-auto"
                      size="sm"
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* No providers found */}
        {filteredProviders.length === 0 && !loading && (
          <div className="text-center mt-8 px-4">
            {searchQuery ? (
              <div>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                  No providers found matching "{searchQuery}"
                </p>
                <Button
                  onClick={() => setSearchQuery("")}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Clear search
                </Button>
              </div>
            ) : (
              <p className="text-gray-600 text-sm sm:text-base">
                No providers found for this service.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}