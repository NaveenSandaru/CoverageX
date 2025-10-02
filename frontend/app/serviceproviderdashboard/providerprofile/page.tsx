"use client";

import React, { useEffect, useState, useContext } from 'react';
import { User, Mail, Phone, Lock, Shield, Camera, X } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '@/context/auth-context';
import { toast } from 'sonner';
import { Button } from "@/Components/ui/button";
import { useRouter } from "next/navigation";

interface ClientData {
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

interface Service {
  service_id: string;
  service: string;
  picture: string | null;
  description: string | null;
}

const ProviderProfilePage = () => {
  const { user, isLoadingAuth } = useContext(AuthContext);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [serviceData, setServiceData] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    firstName: '',
    lastName: '',
    company_name: '',
    company_address: '',
    company_phone_number: '',
    language: '',
    service_type: '',
    specialization: '',
    work_days_from: '',
    work_days_to: '',
    work_hours_from: '',
    work_hours_to: '',
    appointment_duration: '',
    appointment_fee: 0,
    newProfilePicture: null as File | null,
    newProfilePicturePreview: '' as string
  });
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth && user?.email) {
      fetchClientData();
    } else if (!isLoadingAuth && !user?.email) {
      toast.error("User not found");
      router.push("/");
    }
  }, [user?.email, isLoadingAuth]);

  useEffect(() => {
    if (clientData?.service_type) {
      fetchServiceData(clientData.service_type);
    }
  }, [clientData?.service_type]);

  const fetchClientData = async () => {
    if(isLoadingAuth){
      return;
    }
    if (!user?.email) {
      toast.error("User not found");
      router.push("/");
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/service-providers/sprovider/${user.email}`
      );
      setClientData(response.data);
      const [firstName, ...lastNameParts] = response.data.name.split(" ");
      setEditedData({
        firstName,
        lastName: lastNameParts.join(" "),
        company_name: response.data.company_name,
        company_address: response.data.company_address,
        company_phone_number: response.data.company_phone_number,
        language: response.data.language,
        service_type: response.data.service_type,
        specialization: response.data.specialization || '',
        work_days_from: response.data.work_days_from,
        work_days_to: response.data.work_days_to,
        work_hours_from: response.data.work_hours_from,
        work_hours_to: response.data.work_hours_to,
        appointment_duration: response.data.appointment_duration,
        appointment_fee: response.data.appointment_fee,
        newProfilePicture: null,
        newProfilePicturePreview: ''
      });
    } catch (error: any) {
      toast.error("Failed to fetch profile data", {
        description: error.response?.data?.error || "An error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServiceData = async (serviceId: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/services/${serviceId}`);
      if (response.data.successful) {
        setServiceData(response.data.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch service data:", error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (clientData) {
      const [firstName, ...lastNameParts] = clientData.name.split(" ");
      setEditedData({
        firstName,
        lastName: lastNameParts.join(" "),
        company_name: clientData.company_name,
        company_address: clientData.company_address,
        company_phone_number: clientData.company_phone_number,
        language: clientData.language,
        service_type: clientData.service_type,
        specialization: clientData.specialization || '',
        work_days_from: clientData.work_days_from,
        work_days_to: clientData.work_days_to,
        work_hours_from: clientData.work_hours_from,
        work_hours_to: clientData.work_hours_to,
        appointment_duration: clientData.appointment_duration,
        appointment_fee: clientData.appointment_fee,
        newProfilePicture: null,
        newProfilePicturePreview: ''
      });
    }
    setIsEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File is too large", {
          description: "Please select an image under 5MB"
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error("Invalid file type", {
          description: "Please select an image file"
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedData(prev => ({
          ...prev,
          newProfilePicture: file,
          newProfilePicturePreview: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setEditedData(prev => ({
      ...prev,
      newProfilePicture: null,
      newProfilePicturePreview: ''
    }));
  };

  const handleSave = async () => {
    if (!clientData || !user?.email) return;

    try {
      let profilePicturePath = clientData.profile_picture;

      // If there's a new profile picture, upload it first
      if (editedData.newProfilePicture) {
        const formData = new FormData();
        formData.append('image', editedData.newProfilePicture);

        const uploadResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/photos`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (uploadResponse.data.url) {
          profilePicturePath = uploadResponse.data.url;
        }
      }

      // Update provider information
      const response = await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/service-providers`, {
        email: user.email,
        name: `${editedData.firstName} ${editedData.lastName}`.trim(),
        company_name: editedData.company_name,
        company_address: editedData.company_address,
        company_phone_number: editedData.company_phone_number,
        language: editedData.language,
        service_type: clientData.service_type,
        specialization: editedData.specialization,
        work_days_from: editedData.work_days_from,
        work_days_to: editedData.work_days_to,
        work_hours_from: editedData.work_hours_from,
        work_hours_to: editedData.work_hours_to,
        appointment_duration: editedData.appointment_duration,
        appointment_fee: editedData.appointment_fee,
        profile_picture: profilePicturePath
      });

      setClientData(response.data);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error("Failed to update profile", {
        description: error.response?.data?.error || "An error occurred"
      });
    }
  };

  const handleChangePassword = () => {
    if (clientData?.email) {
      router.push(`/serviceproviderdashboard/changepassword?email=${encodeURIComponent(clientData.email)}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">No profile data found</div>
      </div>
    );
  }

  // Split the full name into first and last name for display
  const [firstName, ...lastNameParts] = clientData.name.split(" ");
  const lastName = lastNameParts.join(" ");

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-white px-6 py-8 sm:px-8">
            <div className="text-center">
              {/* Profile Avatar */}
              <div className="relative mx-auto h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gray-100 flex items-center justify-center mb-4 overflow-hidden group">
                {(editedData.newProfilePicturePreview || clientData.profile_picture) ? (
                  <img 
                    src={editedData.newProfilePicturePreview || `${process.env.NEXT_PUBLIC_BACKEND_URL}${clientData.profile_picture}`}
                    alt={clientData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                )}
                
                {isEditing && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <label htmlFor="profile-picture" className="cursor-pointer p-2 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100">
                      <Camera className="h-5 w-5 text-gray-700" />
                    </label>
                    <input
                      type="file"
                      id="profile-picture"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {isEditing && editedData.newProfilePicturePreview && (
                <button
                  onClick={handleRemoveImage}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center justify-center mx-auto space-x-1"
                >
                  <X className="h-4 w-4" />
                  <span>Remove new image</span>
                </button>
              )}
              
              {/* Name and Email */}
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">
                {clientData.name}
              </h1>
              <p className="text-sm sm:text-base text-gray-500">
                {clientData.email}
              </p>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="border-t border-gray-200 px-6 py-6 sm:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">Personal & Business Information</h2>
              {!isEditing ? (
                <Button 
                  onClick={handleEdit}
                  variant="outline"
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Edit Profile
                </Button>
              ) : (
                <div className="space-x-2">
                  <Button 
                    onClick={handleSave}
                    variant="default"
                    className="text-sm bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    Save Changes
                  </Button>
                  <Button 
                    onClick={handleCancel}
                    variant="outline"
                    className="text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={isEditing ? editedData.firstName : firstName}
                    onChange={(e) => setEditedData({ ...editedData, firstName: e.target.value })}
                    readOnly={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      isEditing ? 'bg-white' : 'bg-gray-50'
                    } text-gray-900 text-sm sm:text-base ${
                      isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                    }`}
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={isEditing ? editedData.lastName : lastName}
                    onChange={(e) => setEditedData({ ...editedData, lastName: e.target.value })}
                    readOnly={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      isEditing ? 'bg-white' : 'bg-gray-50'
                    } text-gray-900 text-sm sm:text-base ${
                      isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Business Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={isEditing ? editedData.company_name : clientData?.company_name}
                    onChange={(e) => setEditedData({ ...editedData, company_name: e.target.value })}
                    readOnly={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      isEditing ? 'bg-white' : 'bg-gray-50'
                    } text-gray-900 text-sm sm:text-base ${
                      isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Phone
                  </label>
                  <input
                    type="tel"
                    value={isEditing ? editedData.company_phone_number : clientData?.company_phone_number}
                    onChange={(e) => setEditedData({ ...editedData, company_phone_number: e.target.value })}
                    readOnly={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      isEditing ? 'bg-white' : 'bg-gray-50'
                    } text-gray-900 text-sm sm:text-base ${
                      isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Address
                </label>
                <textarea
                  value={isEditing ? editedData.company_address : clientData?.company_address}
                  onChange={(e) => setEditedData({ ...editedData, company_address: e.target.value })}
                  readOnly={!isEditing}
                  rows={3}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                    isEditing ? 'bg-white' : 'bg-gray-50'
                  } text-gray-900 text-sm sm:text-base ${
                    isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                  }`}
                />
              </div>

              {/* Service Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Type
                  </label>
                  <input
                    type="text"
                    value={serviceData?.service || "Loading..."}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500 mt-1">Service type cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={isEditing ? editedData.specialization : clientData?.specialization || ''}
                    onChange={(e) => setEditedData({ ...editedData, specialization: e.target.value })}
                    readOnly={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      isEditing ? 'bg-white' : 'bg-gray-50'
                    } text-gray-900 text-sm sm:text-base ${
                      isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Working Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Days
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">From</label>
                      <input
                        type="text"
                        value={isEditing ? editedData.work_days_from : clientData?.work_days_from}
                        onChange={(e) => setEditedData({ ...editedData, work_days_from: e.target.value })}
                        readOnly={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                          isEditing ? 'bg-white' : 'bg-gray-50'
                        } text-gray-900 text-sm sm:text-base ${
                          isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">To</label>
                      <input
                        type="text"
                        value={isEditing ? editedData.work_days_to : clientData?.work_days_to}
                        onChange={(e) => setEditedData({ ...editedData, work_days_to: e.target.value })}
                        readOnly={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                          isEditing ? 'bg-white' : 'bg-gray-50'
                        } text-gray-900 text-sm sm:text-base ${
                          isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Hours
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">From</label>
                      <input
                        type="time"
                        value={isEditing ? editedData.work_hours_from : clientData?.work_hours_from}
                        onChange={(e) => setEditedData({ ...editedData, work_hours_from: e.target.value })}
                        readOnly={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                          isEditing ? 'bg-white' : 'bg-gray-50'
                        } text-gray-900 text-sm sm:text-base ${
                          isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">To</label>
                      <input
                        type="time"
                        value={isEditing ? editedData.work_hours_to : clientData?.work_hours_to}
                        onChange={(e) => setEditedData({ ...editedData, work_hours_to: e.target.value })}
                        readOnly={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                          isEditing ? 'bg-white' : 'bg-gray-50'
                        } text-gray-900 text-sm sm:text-base ${
                          isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointment Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Duration (minutes)
                  </label>
                  <input
                    type="text"
                    value={isEditing ? editedData.appointment_duration : clientData?.appointment_duration}
                    onChange={(e) => setEditedData({ ...editedData, appointment_duration: e.target.value })}
                    readOnly={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      isEditing ? 'bg-white' : 'bg-gray-50'
                    } text-gray-900 text-sm sm:text-base ${
                      isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Fee
                  </label>
                  <input
                    type="number"
                    value={isEditing ? editedData.appointment_fee : clientData?.appointment_fee}
                    onChange={(e) => setEditedData({ ...editedData, appointment_fee: Number(e.target.value) })}
                    readOnly={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      isEditing ? 'bg-white' : 'bg-gray-50'
                    } text-gray-900 text-sm sm:text-base ${
                      isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="border-t border-gray-200 px-6 py-6 sm:px-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Password</h2>
              <button 
                onClick={handleChangePassword}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Change Password
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <Lock className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <div className="text-gray-400 text-sm sm:text-base tracking-wider">
                  ••••••••••••••••••••••••••••••••
                </div>
              </div>
            </div>
          </div>

          {/* Security Questions Section */}
          <div className="border-t border-gray-200 px-6 py-6 sm:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-medium text-gray-900">Security Questions</h2>
              </div>
              <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                Change Security Questions
              </button>
            </div>
          </div>

          {/* Back Button Section */}
          <div className="border-t border-gray-200 px-6 py-6 sm:px-8">
            <div className="flex justify-center">
              <Button
                onClick={() => router.push('/serviceproviderdashboard')}
                variant="outline"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderProfilePage;