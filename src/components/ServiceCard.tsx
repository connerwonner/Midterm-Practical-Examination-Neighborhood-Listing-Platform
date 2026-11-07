"use client";

export type Service = {
  id: string;
  title: string;
  hourly_rate: number;
  duration_minutes: number;
  coverage_radius_miles: number;
};

type CardProps = Service & { onBook?: (id: string, title: string) => void };

export function ServiceCard({
  id,
  title,
  hourly_rate,
  duration_minutes,
  coverage_radius_miles,
  onBook,
}: CardProps) {
  return (
    <article className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
      <header>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </header>
      <ul className="mt-2 space-y-1 text-sm text-gray-700">
        <li>Rate: ${Number(hourly_rate).toFixed(2)}/hr</li>
        <li>Duration: {duration_minutes} min</li>
        <li>Coverage radius: {coverage_radius_miles} miles</li>
      </ul>
      <button
        type="button"
        aria-label={`Book appointment for ${title}`}
        onClick={() => onBook?.(id, title)}
        className="mt-4 rounded bg-blue-700 px-4 py-2 text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
      >
        Book Now
      </button>
    </article>
  );
}

export function ServiceGrid({
  services,
  onBook,
}: {
  services: Service[];
  onBook?: (id: string, title: string) => void;
}) {
  return (
    <section
      aria-label="Approved services"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      {services.map((s) => (
        <ServiceCard key={s.id} {...s} onBook={onBook} />
      ))}
    </section>
  );
}
