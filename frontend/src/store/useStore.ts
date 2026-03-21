import { create } from "zustand";

interface User {
  id: string;
  username: string;
  phone: string;
  token: string;
}

interface StoreState {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useStore = create<StoreState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
