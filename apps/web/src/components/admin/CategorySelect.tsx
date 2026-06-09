import { useState } from "react";
import * as LucideIcons from "lucide-react";
import { ChevronDown } from "lucide-react";

interface CategorySelectProps {
  value: string;
  onChange: (val: string) => void;
  categories: any[];
}

export function CategorySelect({ value, onChange, categories }: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const selectedCat = categories.find(c => c.id === value);
  const SelectedIcon = selectedCat?.iconName ? (LucideIcons as any)[selectedCat.iconName] : null;

  return (
    <div className="relative w-full max-w-[150px]">
      <button 
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-2 py-2 bg-primary/5 border-t border-b border-r border-primary/20 text-xs focus:outline-none flex items-center justify-between"
      >
        <span className="flex items-center gap-2 truncate">
          {SelectedIcon && <SelectedIcon className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />}
          <span className="truncate">{selectedCat ? selectedCat.categoryName : "Category..."}</span>
        </span>
        <ChevronDown className="w-3.5 h-3.5 opacity-50 flex-shrink-0 ml-1" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full left-0 mt-1 w-full min-w-[200px] bg-background border border-primary/30 rounded shadow-xl overflow-hidden max-h-48 overflow-y-auto p-1">
             <div 
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-primary/10 rounded cursor-pointer text-xs"
                onClick={() => { onChange(""); setOpen(false); }}
              >
                Category...
              </div>
            {categories.map(c => {
              const Icon = c.iconName ? (LucideIcons as any)[c.iconName] : null;
              return (
                <div 
                  key={c.id}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-primary/10 rounded cursor-pointer text-sm"
                  onClick={() => { onChange(c.id); setOpen(false); }}
                >
                  {Icon ? <Icon className="w-4 h-4 text-primary/70 flex-shrink-0" /> : <div className="w-4 h-4 flex-shrink-0" />}
                  <span className="truncate">{c.categoryName}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
