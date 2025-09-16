import { createContext, useContext } from "react";
import type { UserProfile } from "../lib/types";

type UserContextValue = {
  user: UserProfile | null;
  refreshUser: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
};

export const UserContext = createContext<UserContextValue | undefined>(undefined);

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserContext provider");
  }
  return ctx;
}
