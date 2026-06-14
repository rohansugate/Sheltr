import { mockLandlord, mockSeeker } from "./mock-data";
import type { Listing, User } from "./types";

export function resolveSeeker(currentUser: User | null): User {
  if (currentUser?.role === "SEEKER") return currentUser;
  return mockSeeker;
}

export function resolveLandlord(currentUser: User | null): User {
  if (currentUser?.role === "LANDLORD") return currentUser;
  return mockLandlord;
}

export function resolveLandlordForListing(
  listing: Listing | undefined,
  currentUser: User | null,
): { id: string; name: string } {
  const landlordId = listing?.landlordId;

  if (
    landlordId &&
    currentUser?.role === "LANDLORD" &&
    currentUser.id === landlordId
  ) {
    return {
      id: landlordId,
      name: `${currentUser.firstName} ${currentUser.lastName}`,
    };
  }

  if (landlordId === mockLandlord.id) {
    return {
      id: mockLandlord.id,
      name: `${mockLandlord.firstName} ${mockLandlord.lastName}`,
    };
  }

  if (currentUser?.role === "LANDLORD") {
    return {
      id: currentUser.id,
      name: `${currentUser.firstName} ${currentUser.lastName}`,
    };
  }

  return { id: landlordId ?? mockLandlord.id, name: "Landlord" };
}

export function displayName(user: User) {
  return `${user.firstName} ${user.lastName}`;
}

export function initials(user: User) {
  return `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`;
}
