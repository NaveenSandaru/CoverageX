"use client";

import { useParams, useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";
import { Button } from "@/Components/ui/button";
import { Card } from "@/Components/ui/card";
import { Calendar } from "@/Components/ui/calendar";
import { AuthContext } from '@/context/auth-context';
import { toast } from "sonner";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/Components/ui/dialog";
import { Textarea } from "@/Components/ui/textarea";


interface Provider {
  email: string;
  name: string;
  profile_picture: string;
  company_name: string;
  company_address: string;
  company_phone_number: string;
  appointment_fee: number;
  appointment_duration: string;
  work_hours_from: string;
  work_hours_to: string;
  service_type: string;
  specialization: string;
}

interface Service {
  service_id: string;
  service: string;
  description: string;
}

interface Appointment {
  appointment_id: string;
  client_email: string;
  service_provider_email: string;
  date: string; // YYYY-MM-DD
  time_from: string; // HH:MM:SS
  time_to: string; // HH:MM:SS
  note?: string;
}

export default function BookingPage() {
  const { user, isLoadingAuth } = useContext(AuthContext);
  const { email } = useParams();
  const decodedEmail = decodeURIComponent(email as string);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [currentAppointments, setCurrentAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const router = useRouter();

  const bookedDates = useMemo(() => {
    return currentAppointments.map(app => new Date(app.date));
  }, [currentAppointments]);

  const fetchProvider = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/service-providers/sprovider/${decodedEmail}`
      );
      if (response.data) {
        setProvider(response.data);
      }
    }
    catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to fetch provider details"
      });
    }
    finally {
      setIsLoading(false);
    }
  }

  const fetchServices = async (service_id: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/services/${service_id}`
      );
      if (response.data) {
        setService(response.data.data);
      }
    }
    catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to fetch service details"
      });
    }
    finally {
      setIsLoading(false);
    }
  }

  const fetchCurrentAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/appointments/sprovider/${provider?.email}`,
      );
      if (response.data) {
        setCurrentAppointments(response.data);
      }
    }
    catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to fetch current appointments"
      });
    }
    finally {
      setIsLoading(false);
    }
  }

  const pad = (n: number) => n.toString().padStart(2, '0');

  const isTimeSlotAvailable = (date: Date | undefined, timeSlot: string): boolean => {
    if (!provider || !date) return true;
  
    // Get date string in YYYY-MM-DD format for comparison
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
  
    const [hours, minutes] = timeSlot.split(':').map(Number);
  
    // Calculate slot start and end times
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hours, minutes, 0, 0);
  
    const slotEnd = new Date(slotStart);
    const durationMatch = provider.appointment_duration.match(/\d+/);
    const durationInMinutes = durationMatch ? parseInt(durationMatch[0]) : 0;
    slotEnd.setMinutes(slotEnd.getMinutes() + durationInMinutes);
  
    // Filter appointments for the selected date only
    const appointmentsForDate = currentAppointments.filter(app => {
      const appDate = new Date(app.date + 'T00:00:00');
      appDate.setHours(0, 0, 0, 0);
      const appDateStr = appDate.toISOString().split('T')[0];
      return appDateStr === selectedDateStr;
    });
  
    return !appointmentsForDate.some(app => {
      // Parse appointment times (HH:MM:SS)
      const [appHours, appMinutes] = app.time_from.split(':').map(Number);
      const appStart = new Date(selectedDate);
      appStart.setHours(appHours, appMinutes, 0, 0);
  
      const [appEndHours, appEndMinutes] = app.time_to.split(':').map(Number);
      const appEnd = new Date(selectedDate);
      appEnd.setHours(appEndHours, appEndMinutes, 0, 0);
  
      // Check for time overlap
      const isOverlap = slotStart < appEnd && slotEnd > appStart;
      
      // If it's a provider blocked time (no client_email), return the overlap status
      if (!app.client_email) {
        return isOverlap;
      }
      // For client bookings, only block if there's an overlap
      return isOverlap;
    });
  };

  const isTimeSlotBooked = (date: Date | undefined, timeSlot: string): boolean => {
    if (!date) return false;
  
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
  
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotTime = `${pad(hours)}:${pad(minutes)}:00`;
  
    // Filter appointments for the selected date only
    const appointmentsForDate = currentAppointments.filter(app => {
      const appDate = new Date(app.date + 'T00:00:00');
      appDate.setHours(0, 0, 0, 0);
      const appDateStr = appDate.toISOString().split('T')[0];
      return appDateStr === selectedDateStr && app.client_email; // Only consider appointments with client_email
    });
  
    return appointmentsForDate.some(app => app.time_from === slotTime);
  };

  const isTimeSlotBookedByUser = (date: Date | undefined, timeSlot: string): boolean => {
    if (!date || !user) return false;
  
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
  
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotTime = `${pad(hours)}:${pad(minutes)}:00`;
  
    // Filter appointments for the selected date only
    const appointmentsForDate = currentAppointments.filter(app => {
      const appDate = new Date(app.date + 'T00:00:00');
      appDate.setHours(0, 0, 0, 0);
      const appDateStr = appDate.toISOString().split('T')[0];
      return appDateStr === selectedDateStr && app.client_email; // Only consider appointments with client_email
    });
  
    return appointmentsForDate.some(app => 
      app.time_from === slotTime && 
      app.client_email === user.email
    );
  };

  const isPastTimeSlot = (date: Date | undefined, timeSlot: string): boolean => {
    if (!date) return true;

    const now = new Date();
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hours, minutes, 0, 0);

    return slotDateTime < now;
  };

  const getTimeSlotState = (date: Date | undefined, timeSlot: string): 'available' | 'booked' | 'blocked' | 'user-booked' => {
    if (!date) return 'blocked';
    
    // Check if it's a past time slot
    if (isPastTimeSlot(date, timeSlot)) {
      return 'blocked';
    }
  
    // Check if the user has already booked this slot
    if (isTimeSlotBookedByUser(date, timeSlot)) {
      return 'user-booked';
    }
  
    // Check if this specific time slot is blocked by the provider
    const isProviderBlocked = currentAppointments.some(app => {
      if (!app.client_email) {
        const appDate = new Date(app.date + 'T00:00:00');
        appDate.setHours(0, 0, 0, 0);
        const appDateStr = appDate.toISOString().split('T')[0];
        
        const selectedDateCopy = new Date(date);
        selectedDateCopy.setHours(0, 0, 0, 0);
        const selectedDateStr = selectedDateCopy.toISOString().split('T')[0];
        
        if (appDateStr !== selectedDateStr) return false;
        
        const [hours, minutes] = timeSlot.split(':').map(Number);
        const slotTime = `${pad(hours)}:${pad(minutes)}:00`;
        
        // Check if this exact time slot is blocked
        if (app.time_from === slotTime) {
          return true;
        }
        
        // Also check if this time falls within a blocked time range
        const [appStartHours, appStartMinutes] = app.time_from.split(':').map(Number);
        const appStart = new Date(selectedDate);
        appStart.setHours(appStartHours, appStartMinutes, 0, 0);
  
        const [appEndHours, appEndMinutes] = app.time_to.split(':').map(Number);
        const appEnd = new Date(selectedDate);
        appEnd.setHours(appEndHours, appEndMinutes, 0, 0);
  
        const slotTimeDate = new Date(selectedDate);
        slotTimeDate.setHours(hours, minutes, 0, 0);
  
        return slotTimeDate >= appStart && slotTimeDate < appEnd;
      }
      return false;
    });
  
    if (isProviderBlocked) {
      return 'blocked';
    }
  
    // Check general availability
    if (!isTimeSlotAvailable(date, timeSlot)) {
      if (isTimeSlotBooked(date, timeSlot)) {
        return 'booked';
      }
      return 'blocked';
    }
    return 'available';
  };

   const handleNoteSubmit = async (shouldBook: boolean) => {
    setIsNoteDialogOpen(false);
    if (shouldBook) {
      await processBooking();
    }
  };

  const handleConfirmBooking = () => {
    if (!selectedDate || !selectedTime || !provider?.email || !user?.email) {
      toast.error("Missing Information", {
        description: "Please select a date and time for your appointment."
      });
      return;
    }

   

    // Check if selected date is in the past
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const selectedDateCopy = new Date(selectedDate);
    selectedDateCopy.setHours(0, 0, 0, 0);
    
    if (selectedDateCopy < now) {
      toast.error("Invalid Date", {
        description: "Cannot book appointments in the past."
      });
      return;
    }

    // Check if time slot is still available
    if (!isTimeSlotAvailable(selectedDate, selectedTime)) {
      toast.error("Time Slot Unavailable", {
        description: "This time slot is no longer available. Please select another time."
      });
      return;
    }

    // Open note dialog
    setIsNoteDialogOpen(true);
  };

  const processBooking = async () => {
    try {
      setIsLoading(true);
      if (!selectedDate || !selectedTime || !provider || !user) {
        throw new Error("Missing required booking information");
      }

      // Create a date string that preserves the selected date regardless of timezone
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`; // YYYY-MM-DD
      
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const timeFromStr = `${pad(hours)}:${pad(minutes)}:00`;
      
      const durationMatch = provider.appointment_duration.match(/\d+/);
      const durationInMinutes = durationMatch ? parseInt(durationMatch[0]) : 0;

      if (durationInMinutes === 0) {
        toast.error("Invalid Duration", {
          description: "Invalid appointment duration. Please contact support."
        });
        return;
      }

      // Calculate end time using the selected date components
      const endTime = new Date(year, selectedDate.getMonth(), selectedDate.getDate(), hours, minutes + durationInMinutes);
      const timeToStr = `${pad(endTime.getHours())}:${pad(endTime.getMinutes())}:00`;

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/appointments`,
        {
          client_email: user.email,
          service_provider_email: provider.email,
          date: dateStr,
          time_from: timeFromStr,
          time_to: timeToStr,
          note: note || undefined
        }
      );

      if (response.status === 201) {
        toast.success("Success", {
          description: "Your appointment has been booked successfully!"
        });
        setNote('');
        fetchCurrentAppointments();
      } else {
        throw new Error(response.data.error || "Failed to book appointment");
      }
    } catch (error: any) {
      toast.error("Booking Failed", {
        description: error.message || "Failed to book appointment. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateTimeSlots = (
    startTime: string, // HH:MM:SS
    endTime: string,   // HH:MM:SS
    interval: number   // in minutes
  ): string[] => {
    const slots: string[] = [];
    
    // Parse start and end times
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    let currentHours = startHours;
    let currentMinutes = startMinutes;

    while (currentHours < endHours || (currentHours === endHours && currentMinutes < endMinutes)) {
      slots.push(`${pad(currentHours)}:${pad(currentMinutes)}`);
      
      // Increment by interval
      currentMinutes += interval;
      if (currentMinutes >= 60) {
        currentHours += Math.floor(currentMinutes / 60);
        currentMinutes = currentMinutes % 60;
      }
    }

    return slots;
  };

  const timeSlots = provider
    ? generateTimeSlots(
      provider.work_hours_from,
      provider.work_hours_to,
      parseInt(provider.appointment_duration)
    ): [];

  useEffect(() => {
    fetchProvider();
  }, [decodedEmail]);

  useEffect(() => {
    if (provider) {
      fetchServices(provider.service_type);
      fetchCurrentAppointments();
    }
  }, [provider]);

  useEffect(() => {
    if (isLoadingAuth) return;
  
    if (user == null) {
      toast.error("Please log in to book an appointment", {
        description: "You must be logged in to book an appointment.",
      });
  
      router.push("/auth/login");
    }
  }, [user, isLoadingAuth]);
  

  if (!provider || !service) {
    return <p className="p-4 text-gray-500">Loading provider details...</p>;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Card className="overflow-hidden bg-white shadow-lg rounded-lg">
            <div className="flex flex-col lg:flex-row">
              {/* Provider Profile Section */}
              <div className="w-full lg:w-80 xl:w-96 p-4 sm:p-6 bg-gray-50 border-b lg:border-b-0 lg:border-r">
                <div className="text-center lg:text-left">
                  <div className="flex flex-col sm:flex-row lg:flex-col items-center sm:items-start lg:items-center gap-4 sm:gap-6 lg:gap-3">
                    <img
                      src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${provider.profile_picture}`}
                      alt={provider.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 lg:w-20 lg:h-20 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 sm:text-left lg:text-center">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 capitalize">{provider.name}</h2>
                      <h4 className="text-emerald-500 text-sm sm:text-base capitalize">{service?.service}</h4>
                      <h4 className="text-gray-600 font-semibold text-sm capitalize">{provider.specialization}</h4>
                      <h3 className="text-emerald-600 font-medium text-sm sm:text-base capitalize">{provider.company_name}</h3>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 space-y-3 mt-4 sm:mt-6 text-center">
                    <div className="pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4 lg:gap-3">
                        <div>
                          <div className="font-medium text-gray-700 mb-1">Location: </div>
                          <div className="text-xs sm:text-sm leading-relaxed text-gray-600">
                            {provider.company_address}
                          </div>
                        </div>

                        <div>
                          <div className="font-medium text-gray-700 mb-1">Call Us:</div>
                          <div className="font-medium text-gray-800 text-sm">
                            {provider.company_phone_number}
                          </div>
                        </div>

                        <div>
                          <div className="font-medium text-gray-700 mb-1">Price:</div>
                          <div className="text-emerald-600 font-semibold">
                            ${provider.appointment_fee}
                          </div>
                        </div>

                        <div>
                          <div className="font-medium text-gray-700 mb-1">Duration:</div>
                          <div className="text-gray-600">
                            {provider.appointment_duration}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Section */}
              <div className="flex-1 p-4 sm:p-6">
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">Book Your Appointment</h3>
                  <p className="text-sm text-gray-600">Select Date & Time</p>
                </div>

                <div className="flex flex-col items-center space-y-6">
                  {/* Calendar - Made larger and centered */}
                  <div className="w-full max-w-lg">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      modifiers={{ booked: bookedDates }}
                      modifiersClassNames={{
                        booked: "relative after:content-[''] after:block after:w-1.5 after:h-1.5 after:rounded-full after:bg-red-500 after:mx-auto after:mt-0.5"
                      }}
                      className="w-full mx-auto"
                      classNames={{
                        months: "flex w-full justify-center",
                        month: "space-y-4 w-full",
                        caption: "flex justify-center pt-2 relative items-center text-lg font-semibold mb-4",
                        caption_label: "text-lg font-semibold",
                        nav: "space-x-2 flex items-center",
                        nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100",
                        table: "w-full border-collapse",
                        head_row: "flex w-full mb-2",
                        head_cell: "text-gray-500 rounded-md w-12 h-12 font-medium text-sm text-center flex-1 flex items-center justify-center",
                        row: "flex w-full mt-1",
                        cell: "text-center text-sm p-0 relative flex-1 h-12",
                        day: "h-12 w-12 p-0 font-normal text-sm hover:bg-gray-100 rounded mx-auto flex items-center justify-center",
                        day_selected: "bg-gray-100 hover:bg-emerald-700 text-gray-500",
                        day_today: "bg-gray-50 text-gray-900 font-semibold",
                        day_outside: "text-gray-400 opacity-50",
                      }}
                    />
                  </div>

                  {/* Time Slots Legend */}
                  <div className="w-full max-w-2xl mb-4">
                    <div className="flex items-center justify-center space-x-6">
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded border border-gray-300 bg-white mr-2"></div>
                        <span className="text-sm text-gray-600">Available</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded bg-red-100 border border-red-300 mr-2"></div>
                        <span className="text-sm text-gray-600">Booked</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded bg-gray-200 mr-2"></div>
                        <span className="text-sm text-gray-600">Blocked</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300 mr-2"></div>
                        <span className="text-sm text-gray-600">Your Booking</span>
                      </div>
                    </div>
                  </div>

                  {/* Available Time Slots */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3">
                    {timeSlots.map((slot) => {
                      const slotState = getTimeSlotState(selectedDate, slot);
                      return (
                        <Button
                          key={slot}
                          variant={selectedTime === slot ? "default" : "outline"}
                          onClick={() => slotState === 'available' && setSelectedTime(slot)}
                          size="sm"
                          disabled={slotState !== 'available'}
                          className={`text-sm h-10 ${
                            selectedTime === slot
                              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                              : slotState === 'available'
                                ? "border-gray-300 hover:border-emerald-500 text-gray-700 hover:bg-emerald-50"
                                : slotState === 'booked'
                                  ? "bg-red-100 border-red-300 text-red-700 cursor-not-allowed"
                                  : slotState === 'user-booked'
                                    ? "bg-emerald-100 border-emerald-300 text-emerald-700 cursor-not-allowed"
                                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {slot}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Confirm Button */}
                  <div className="w-full max-w-lg">
                    <Button
                      disabled={!selectedDate || !selectedTime}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-medium h-12 px-8 text-base"
                      onClick={handleConfirmBooking}
                    >
                      Confirm Appointment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a Note (Optional)</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter any special requests or notes for your appointment..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter className="flex justify-end space-x-2">
            <Button
              onClick={() => handleNoteSubmit(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {note.trim() ? 'Add Note & Book' : 'Book Without Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}