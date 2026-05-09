// OTA Channel configuration — logos, display info, integration type

export type IntegrationMethod = "API" | "ICAL" | "XML";

export interface ChannelConfig {
  type: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  logo: string; // emoji fallback
  integrationMethod: IntegrationMethod;
  requiresPartnerAccess: boolean;
  docsUrl?: string;
  commissionRange: string;
}

export const CHANNEL_CONFIGS: Record<string, ChannelConfig> = {
  AIRBNB: {
    type: "AIRBNB",
    label: "Airbnb",
    description: "World's largest home-sharing platform",
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    logo: "🏠",
    integrationMethod: "ICAL",
    requiresPartnerAccess: false,
    docsUrl: "https://www.airbnb.com/help/article/2083",
    commissionRange: "3%",
  },
  BOOKING_COM: {
    type: "BOOKING_COM",
    label: "Booking.com",
    description: "Europe's largest accommodation booking platform",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    logo: "🔵",
    integrationMethod: "API",
    requiresPartnerAccess: true,
    docsUrl: "https://developers.booking.com",
    commissionRange: "10–25%",
  },
  GOIBIBO: {
    type: "GOIBIBO",
    label: "Goibibo",
    description: "Leading Indian OTA for domestic travel",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    logo: "✈️",
    integrationMethod: "API",
    requiresPartnerAccess: true,
    docsUrl: "https://www.goibibo.com/hotels/",
    commissionRange: "12–20%",
  },
  MAKEMYTRIP: {
    type: "MAKEMYTRIP",
    label: "MakeMyTrip",
    description: "India's largest online travel company",
    color: "text-red-600",
    bgColor: "bg-red-50",
    logo: "🗺️",
    integrationMethod: "API",
    requiresPartnerAccess: true,
    docsUrl: "https://www.makemytrip.com/partners",
    commissionRange: "12–20%",
  },
  AGODA: {
    type: "AGODA",
    label: "Agoda",
    description: "Asia-Pacific's fastest-growing booking platform",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    logo: "🌏",
    integrationMethod: "API",
    requiresPartnerAccess: true,
    docsUrl: "https://ycs.agoda.com",
    commissionRange: "8–18%",
  },
  EXPEDIA: {
    type: "EXPEDIA",
    label: "Expedia",
    description: "Global OTA with vast distribution network",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    logo: "🌐",
    integrationMethod: "API",
    requiresPartnerAccess: true,
    docsUrl: "https://developers.expediagroup.com",
    commissionRange: "15–25%",
  },
  ICAL: {
    type: "ICAL",
    label: "iCal (Generic)",
    description: "Universal calendar sync for any OTA",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    logo: "📅",
    integrationMethod: "ICAL",
    requiresPartnerAccess: false,
    commissionRange: "Varies",
  },
  DIRECT: {
    type: "DIRECT",
    label: "Direct Booking",
    description: "Bookings made directly through your website",
    color: "text-green-600",
    bgColor: "bg-green-50",
    logo: "🏷️",
    integrationMethod: "API",
    requiresPartnerAccess: false,
    commissionRange: "0%",
  },
};

export function getChannelConfig(type: string): ChannelConfig {
  return CHANNEL_CONFIGS[type] ?? CHANNEL_CONFIGS.ICAL;
}
