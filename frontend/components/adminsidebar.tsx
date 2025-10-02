"use client";

import { usePathname } from "next/navigation";
import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, LogOut, Settings } from "lucide-react"; 
import { AuthContext } from "@/context/auth-context";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/Components/ui/sidebar";

import Image from "next/image";
import { LayoutGrid, KanbanSquare, Ticket, ClipboardList, BookText, Users, UserCheck, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";

const items = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutGrid,
  },
  {
    title: "Appointments",
    url: "/admin/appointments",
    icon: Calendar,
  },
  {
    title: "Service Providers",
    url: "/admin/service-providers",
    icon: UserCheck,
  },
  {
    title: "Clients",
    url: "/admin/clients", 
    icon: Users,
  },
  {
    title: "Services",
    url: "/admin/services",
    icon: KanbanSquare,
  },
];

const AdminSidebar = () => {
  const {setUser, setAccessToken} = useContext(AuthContext);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    setIsLoading(true);
    try{
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/delete_token`,
        {
          withCredentials: true
        }
      );
      if(response.status == 200){
        setUser(null);
        setAccessToken("");
        router.push("/admin");
      }
      else{
        throw new Error("Error logging out");
      }
    }
    catch(err: any){
      toast.error("Error logging out", {
        description: "Could not log out."
      });
    }
    finally{
      setIsLoading(false);
    } 
  };

  return (
    <Sidebar className="w-64 bg-white shadow-sm min-h-screen border-r border-gray-200">
      <SidebarHeader className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-center">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          {/*<Image
            src={"/logo.jpg"}
            alt="Logo"
            width={120}
            height={40}
            className="object-contain"
          />*/}
        </div>
        <p className="text-sm text-gray-600 text-center mt-1">
          Appointment System
        </p>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {items.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a
                        href={item.url}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                          isActive 
                            ? "bg-blue-100 text-blue-700 border border-blue-200 shadow-sm" 
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <item.icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-500"}`} />
                        <span className="font-medium">{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-100">
        <Button 
          type="submit" 
          className="w-full bg-red-600 text-white hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-2 py-2.5" 
          onClick={handleLogout} 
          disabled={isLoading}
        >
          <LogOut className="w-4 h-4" />
          {isLoading ? "Logging out..." : "Logout"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;