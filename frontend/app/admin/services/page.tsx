"use client";

import React, { useState, useEffect, useContext } from 'react';
import { Plus, Pencil, Trash, Loader2, Upload, X } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '@/context/auth-context';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/Components/ui/dialog";
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';

interface Service {
  service_id: string;
  service: string;
  picture: string | null;
  description: string | null;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newService, setNewService] = useState({
    service: '',
    description: '',
    picture: null as File | null,
    picturePreview: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { isLoggedIn, user, isLoadingAuth } = useContext(AuthContext);

  // Check if user is admin
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
  

  // Fetch services
  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/services`
      );
      if (response.data.successful) {
        setServices(response.data.data);
      }
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to fetch services"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

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

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewService(prev => ({
          ...prev,
          picture: file,
          picturePreview: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setNewService(prev => ({
      ...prev,
      picture: null,
      picturePreview: ''
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newService.service.trim()) {
      toast.error("Service name is required");
      return;
    }

    try {
      setIsSubmitting(true);

      let pictureUrl = null;

      // If there's an image, upload it first
      if (newService.picture) {
        const formData = new FormData();
        formData.append('image', newService.picture);

        try {
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
            pictureUrl = uploadResponse.data.url;
          }
        } catch (error: any) {
          toast.error("Error uploading image", {
            description: error.message || "Failed to upload image"
          });
          return;
        }
      }

      
      // Create the service with the image URL
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/services`,
        {
          service: newService.service,
          description: newService.description || null,
          picture: pictureUrl
        }
      );

      if (response.data.successful) {
        toast.success("Service added successfully");
        setNewService({ 
          service: '', 
          description: '', 
          picture: null, 
          picturePreview: '' 
        });
        setIsDialogOpen(false);
        fetchServices(); // Refresh the services list
      }
    } catch (error: any) {
      toast.error("Error adding service", {
        description: error.response?.data?.message || error.message || "Something went wrong"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Services</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="service">Service Name</Label>
                  <Input
                    id="service"
                    value={newService.service}
                    onChange={(e) => setNewService(prev => ({ ...prev, service: e.target.value }))}
                    placeholder="e.g., Dental Care"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newService.description}
                    onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the service..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Service Image</Label>
                  <div className="mt-2 flex items-center gap-4">
                    {newService.picturePreview ? (
                      <div className="relative w-24 h-24">
                        <img
                          src={newService.picturePreview}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 p-1 bg-red-100 rounded-full text-red-600 hover:bg-red-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg">
                        <label htmlFor="picture" className="cursor-pointer text-center p-2">
                          <Upload className="h-6 w-6 mx-auto text-gray-400" />
                          <span className="text-xs text-gray-500 mt-1">Upload</span>
                        </label>
                      </div>
                    )}
                    <input
                      type="file"
                      id="picture"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">
                        Maximum file size: 5MB
                        <br />
                        Supported formats: JPG, PNG, GIF
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                    
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Service'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.service_id}
              className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
            >
              {service.picture && (
                <img
                  src={service.picture.startsWith('/uploads') 
                    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${service.picture}`
                    : service.picture}
                  alt={service.service}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
              )}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {service.service}
              </h3>
              {service.description && (
                <p className="text-gray-600 text-sm mb-4">
                  {service.description}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}