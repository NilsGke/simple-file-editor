import { create } from "zustand";

type Tab = {
  id: number;
  content: string;
  handle: FileSystemFileHandle;
  dirty: boolean;
};
type TabState = {
  tabs: Tab[];
  activeTab: number | null;

  openTab: (tab: Tab) => void;
  closeTab: (id: number) => void;
  setActiveTab: (id: number) => void;
  updateContent: (id: number, content: string) => void;
};

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [],
  activeTab: null,

  openTab: async (newTab) => {
    const { tabs } = get();
    const existing = await Promise.all(
      tabs.map(async (tab) => ({
        tab,
        isSameEntry: await newTab.handle.isSameEntry(tab.handle),
      })),
    ).then((res) => res.find(({ isSameEntry }) => isSameEntry)?.tab);

    set((prev) => {
      if (existing) return { activeTab: existing.id };
      return { activeTab: newTab.id, tabs: [...prev.tabs, newTab] };
    });
  },

  closeTab: (id) =>
    set((prev) => ({ tabs: prev.tabs.filter((tab) => tab.id !== id) })),

  setActiveTab: (id) => set({ activeTab: id }),

  updateContent: (id, content) =>
    set((prev) => ({
      tabs: prev.tabs.map((tab) =>
        tab.id !== id
          ? tab
          : {
              ...tab,
              content,
              dirty: true,
            },
      ),
    })),
}));
