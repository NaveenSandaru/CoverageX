"use client";

import React, { useState, useEffect, useContext } from 'react';
import { Search, Eye, MapPin, Clock, Plus, X } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '@/context/auth-context';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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

const ServiceProvidersPage = () => {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [providerEmail, setProviderEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const router = useRouter();

  const { isLoggedIn, user, isLoadingAuth } = useContext(AuthContext);

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
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${baseURL}/service-providers`);
      setProviders(response.data);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!providerEmail.trim()) return;

    try {
      setIsSubmitting(true);
      await axios.post(`${baseURL}/admins/sendEmail`, {
        email: providerEmail.trim(),
        role: "Service Provider",
        link: "http://localhost:3000/auth/provider-register"
      });
      setShowModal(false);
      setProviderEmail('');
    } catch (error) {
      console.error('Error sending invite:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.phone_number.includes(searchTerm) ||
      provider.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.service_type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Providers</h1>
          <p className="text-gray-600">View service provider database</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Provider
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Provider</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setProviderEmail('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Provider Email
              </label>
              <input
                type="email"
                id="email"
                value={providerEmail}
                onChange={(e) => setProviderEmail(e.target.value)}
                placeholder="Enter provider's email"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleSendInvite}
                disabled={isSubmitting || !providerEmail.trim()}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg ${isSubmitting || !providerEmail.trim()
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-blue-700'
                  }`}
              >
                {isSubmitting ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search providers by name, email, phone, company, or service type..."
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
                    <th className="text-left p-4 font-medium">Provider</th>
                    <th className="text-left p-4 font-medium">Company</th>
                    <th className="text-left p-4 font-medium">Service</th>
                    <th className="text-left p-4 font-medium">Working Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProviders.map((provider) => (
                    <tr key={provider.email} className="border-t hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            {provider.profile_picture ? (
                              <img
                                src={provider.profile_picture}
                                alt={provider.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{provider.name}</div>
                            <div className="text-sm text-gray-600">{provider.email}</div>
                            <div className="text-sm text-gray-600">{provider.phone_number}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                          <div>
                            <div className="font-medium">{provider.company_name}</div>
                            <div className="text-sm text-gray-600">{provider.company_address}</div>
                            <div className="text-sm text-gray-600">{provider.company_phone_number}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{provider.service_type}</div>
                        {provider.specialization && (
                          <div className="text-sm text-gray-600">{provider.specialization}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                          <div>
                            <div className="text-sm">
                              {provider.work_days_from} - {provider.work_days_to}
                            </div>
                            <div className="text-sm">
                              {provider.work_hours_from} - {provider.work_hours_to}
                            </div>
                            <div className="text-sm text-gray-600">
                              {provider.appointment_duration} min / ${provider.appointment_fee}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProviders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No service providers found matching your criteria.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ServiceProvidersPage;