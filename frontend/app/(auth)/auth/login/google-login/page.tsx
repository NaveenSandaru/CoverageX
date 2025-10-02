"use client";

import { useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { AuthContext } from "@/context/auth-context";
import { toast } from "sonner";

export default function GoogleCallback() {
  const { setUser, setAccessToken } = useContext(AuthContext);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    const sendToBackend = async () => {
      try {
        const user = session.user;
        console.debug(session.user);

        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google_login`,
          {
            email: user?.email,
            name: user?.name,
            profile_picture: user?.image,
            phone_number: "",
            password: ""
          },
          {
            withCredentials: true
          }
        );

        if (res.data.successful) {
          setUser(res.data.user);
          setAccessToken(res.data.accessToken);

          toast.success("Google login successful");
          router.push("/");
        } else {
          toast.error("Login failed");
          router.push("/auth/login");
        }
      } catch (err: any) {
        console.error("Google login error:", err);
        toast.error("Login failed", { description: err.message });
        router.push("/auth/login");
      }
    };

    sendToBackend();
  }, [status, session]);
}