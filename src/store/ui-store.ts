import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  landingNavCollapsed: boolean;
  chatSidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  chatSidebarOpen: boolean;
  landingMobileMenuOpen: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  toggleLandingNav: () => void;
  toggleChatSidebarCollapsed: () => void;
  setMobileNavOpen: (open: boolean) => void;
  setChatSidebarOpen: (open: boolean) => void;
  setLandingMobileMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      landingNavCollapsed: false,
      chatSidebarCollapsed: false,
      mobileNavOpen: false,
      chatSidebarOpen: false,
      landingMobileMenuOpen: false,
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleLandingNav: () => set((s) => ({ landingNavCollapsed: !s.landingNavCollapsed })),
      toggleChatSidebarCollapsed: () =>
        set((s) => ({ chatSidebarCollapsed: !s.chatSidebarCollapsed })),
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
      setChatSidebarOpen: (chatSidebarOpen) => set({ chatSidebarOpen }),
      setLandingMobileMenuOpen: (landingMobileMenuOpen) => set({ landingMobileMenuOpen }),
    }),
    {
      name: "lucy-ui",
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        landingNavCollapsed: s.landingNavCollapsed,
        chatSidebarCollapsed: s.chatSidebarCollapsed,
      }),
    },
  ),
);
