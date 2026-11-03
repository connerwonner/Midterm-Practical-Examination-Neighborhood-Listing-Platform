"use client";

import { useEffect, useState } from "react";
import { ServiceGrid, type Service } from "@/components/ServiceCard";

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");
  const [booked, setBooked] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => {
        if (!r.ok) throw new Error("Request failed");
        return r.json();
      })
      .then((data: Service[]) => {
        setServices(data);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Local Merchant Services</h1>

      <p role="status" aria-live="polite" className="mb-4 text-sm text-gray-700">
        {booked ? `Booking requested for ${booked}.` : ""}
      </p>

      {state === "loading" && <p>Loading services...</p>}
      {state === "error" && <p>Could not load services. Please try again.</p>}
      {state === "ready" && services.length === 0 && (
        <p>No approved services yet.</p>
      )}
      {state === "ready" && services.length > 0 && (
        <ServiceGrid services={services} onBook={(_id, title) => setBooked(title)} />
      )}
    </main>
  );
}
