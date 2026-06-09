import { useState } from "react";
import * as LucideIcons from "lucide-react";
import { ChevronDown } from "lucide-react";

interface ExistingSkillSelectProps {
  onSelect: (skillId: string) => void;
  categories: any[];
  addedSkillIds: string[];
}

export function ExistingSkillSelect({ 
  onSelect, 
  categories, 
  addedSkillIds 
}: ExistingSkillSelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex-1 sm:w-auto">
      <button 
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex-1 px-3 py-2 bg-primary/5 border border-primary/20 rounded-md text-xs focus:outline-none flex items-center justify-between text-muted-foreground/80"
      >
        <span>+ Add existing skill...</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-50 flex-shrink-0 ml-2" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full left-0 mt-1 w-full min-w-[250px] bg-background border border-primary/30 rounded shadow-2xl overflow-hidden max-h-64 overflow-y-auto p-1">
            {categories.map(c => {
              if (!c.skills || c.skills.length === 0) return null;
              const Icon = c.iconName ? (LucideIcons as any)[c.iconName] : null;
              return (
                <div key={c.id} className="mb-2 last:mb-0">
                  <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-primary/5 rounded">
                    {Icon && <Icon className="w-3.5 h-3.5 text-primary/70" />}
                    {c.categoryName}
                  </div>
                  <div className="py-1">
                    {c.skills.map((s: any) => {
                      const isAdded = addedSkillIds.includes(s.id);
                      return (
                        <div 
                          key={s.id}
                          className={`flex items-center justify-between px-3 py-1.5 text-sm rounded cursor-pointer ${
                            isAdded 
                              ? "opacity-50 cursor-not-allowed bg-muted/50 text-muted-foreground" 
                              : "hover:bg-primary/10 text-foreground font-medium"
                          }`}
                          onClick={() => {
                            if (!isAdded) {
                              onSelect(s.id);
                              setOpen(false);
                            }
                          }}
                        >
                          <span>{s.skillName}</span>
                          {isAdded && <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider bg-background px-1.5 py-0.5 rounded border border-border">Added</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
