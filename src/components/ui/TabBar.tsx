import { withReactViewTransition } from "@/helpers/viewTransition";
import { cn } from "@/lib/utils";
import { useTabStore } from "@/store";

export default function TabBar() {
  const { tabs, activeTab, setActiveTab, closeTab } = useTabStore();

  return (
    <div className="flex gap-2 h-10 border-b-2 border-b-zinc-700">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn(
            "h-full flex px-2 justify-center rounded-t bg-zinc-800",
            tab.id === activeTab && "bg-zinc-700",
          )}
          style={{ viewTransitionName: "tab-" + tab.id }}
        >
          <button onClick={() => setActiveTab(tab.id)} className="p-2">
            {tab.handle.name}
          </button>
          <button
            onClick={() => withReactViewTransition(() => closeTab(tab.id))}
            className="text-sm p-2"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
