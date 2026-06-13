import type { Application, Showing } from "./types";
import { mockLandlord, mockSeeker } from "./mock-data";

export const SEED_SHOWINGS: Showing[] = [
  {
    id: "showing-seed-1",
    listingId: "listing-1",
    seekerId: "seeker-demo-1",
    seekerName: "Anh Nguyen",
    date: "2026-06-18",
    time: "14:00",
    contactMethod: "phone",
    contactValue: "(415) 555-0142",
    status: "REQUESTED",
    createdAt: new Date().toISOString(),
  },
  {
    id: "showing-seed-2",
    listingId: "listing-5",
    seekerId: mockSeeker.id,
    seekerName: `${mockSeeker.firstName} ${mockSeeker.lastName}`,
    date: "2026-06-17",
    time: "11:30",
    contactMethod: "email",
    contactValue: "carlos.m@email.com",
    status: "ACCEPTED",
    landlordMessage: "See you at the front gate. Parking on Elm St.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "showing-seed-3",
    listingId: "listing-7",
    seekerId: "seeker-demo-3",
    seekerName: "Priya Sharma",
    date: "2026-06-19",
    time: "16:00",
    contactMethod: "phone",
    contactValue: "(510) 555-0198",
    status: "REQUESTED",
    createdAt: new Date().toISOString(),
  },
];

export const SEED_APPLICATIONS: Application[] = [
  {
    id: "app-seed-1",
    listingId: "listing-5",
    showingId: "showing-seed-2",
    seekerId: mockSeeker.id,
    seekerName: `${mockSeeker.firstName} ${mockSeeker.lastName}`,
    packet: {
      voucherSize: 2,
      maxRent: 1600,
      voucherCaseNumber: "HCV-2024-88421",
      employment: "Warehouse associate — part-time",
      references: "Maria Lopez (prior landlord), James Chen (employer)",
    },
    status: "VIEWED",
    sentAt: new Date().toISOString(),
  },
];

export function isLandlordListing(listingId: string, landlordId: string, listingLandlordId?: string) {
  return listingLandlordId === landlordId;
}
