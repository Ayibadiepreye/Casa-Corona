
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatNaira = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Temp types to keep the build passing
export type Category = { id: string; name: string; icon: string };
export type Vendor = any;
export type AdminStats = any;
export type AdminVendor = any;

// Keep some basic mock data for now (we'll replace in later phases)
export const categories = [
  { id: "hair", name: "Hair", icon: "Scissors" },
  { id: "nails", name: "Nails", icon: "Sparkles" },
  { id: "skin-care", name: "Skin Care", icon: "Droplets" },
  { id: "tattoo-piercing", name: "Tattoo & Piercing", icon: "PenTool" },
  { id: "makeup", name: "Makeup", icon: "Brush" },
  { id: "barbers", name: "Barbers", icon: "ScissorsSquare" },
  { id: "lash-brow", name: "Lash & Brow", icon: "Eye" },
  { id: "massage-wellness", name: "Massage & Wellness", icon: "Heart" },
];
export const vendors = [] as any[];
export const portfolioShots = [] as any[];

// Temporary admin stubs
export async function getAdminStats() { return {}; }
export async function getAdminVendors() { return []; }
export async function getAdminRecentActivity() { return []; }
