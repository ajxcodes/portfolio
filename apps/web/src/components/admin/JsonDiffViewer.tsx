import React, { useMemo } from 'react';
import { Plus, Minus, Equal } from 'lucide-react';

interface JsonDiffViewerProps {
  oldValues: string | null;
  newValues: string | null;
}

interface DiffRow {
  key: string;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  oldVal: any;
  newVal: any;
}

export const JsonDiffViewer = ({ oldValues, newValues }: JsonDiffViewerProps) => {
  const diffs = useMemo(() => {
    let oldObj: Record<string, any> = {};
    let newObj: Record<string, any> = {};

    try {
      if (oldValues && oldValues !== "{}") oldObj = JSON.parse(oldValues);
    } catch (e) {
      console.warn("Failed to parse oldValues JSON in diff viewer");
    }

    try {
      if (newValues && newValues !== "{}") newObj = JSON.parse(newValues);
    } catch (e) {
      console.warn("Failed to parse newValues JSON in diff viewer");
    }

    const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)])).sort();

    const rows: DiffRow[] = allKeys.map((key) => {
      const oldVal = oldObj[key];
      const newVal = newObj[key];

      let type: DiffRow['type'] = 'unchanged';

      if (oldVal === undefined && newVal !== undefined) {
        type = 'added';
      } else if (oldVal !== undefined && newVal === undefined) {
        type = 'removed';
      } else if (oldVal !== newVal) {
        // Simple equality check, assumes flat or stringified nested objects
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          type = 'modified';
        }
      }

      return { key, type, oldVal, newVal };
    });

    return rows;
  }, [oldValues, newValues]);

  if (diffs.length === 0) {
    return (
      <div className="p-4 bg-primary/5 border border-primary/10 rounded text-xs font-mono text-muted-foreground italic text-center">
        No changes detected or data is empty.
      </div>
    );
  }

  const formatValue = (val: any) => {
    if (val === undefined || val === null) return <span className="text-muted-foreground/50">null</span>;
    if (typeof val === 'boolean') return <span className="text-amber-500/80">{val.toString()}</span>;
    if (typeof val === 'number') return <span className="text-indigo-400">{val}</span>;
    if (typeof val === 'object') return <span>{JSON.stringify(val)}</span>;
    return <span className="text-emerald-500/80">"{val}"</span>;
  };

  return (
    <div className="border border-primary/10 rounded-lg overflow-hidden bg-background">
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono text-left border-collapse min-w-[400px]">
          <thead className="bg-primary/5 border-b border-primary/10">
            <tr>
              <th className="py-2 px-3 font-bold text-foreground/80 w-1/4">Field</th>
              <th className="py-2 px-3 font-bold text-foreground/80 w-3/8">Previous</th>
              <th className="py-2 px-3 font-bold text-foreground/80 w-3/8">Current</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {diffs.map((row) => (
              <tr 
                key={row.key} 
                className={`
                  ${row.type === 'added' ? 'bg-emerald-500/10' : ''}
                  ${row.type === 'removed' ? 'bg-destructive/10' : ''}
                  ${row.type === 'modified' ? 'bg-amber-500/10' : ''}
                  ${row.type === 'unchanged' ? 'hover:bg-primary/5' : ''}
                `}
              >
                <td className="py-2 px-3 align-top">
                  <div className="flex items-center gap-1.5">
                    {row.type === 'added' && <Plus className="w-3 h-3 text-emerald-500 flex-shrink-0" />}
                    {row.type === 'removed' && <Minus className="w-3 h-3 text-destructive flex-shrink-0" />}
                    {row.type === 'modified' && <div className="w-3 h-3 rounded-full bg-amber-500/50 flex-shrink-0" />}
                    {row.type === 'unchanged' && <Equal className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />}
                    <span className={`font-semibold ${
                      row.type === 'added' ? 'text-emerald-500' : 
                      row.type === 'removed' ? 'text-destructive' : 
                      row.type === 'modified' ? 'text-amber-500' : 
                      'text-muted-foreground'
                    }`}>
                      {row.key}
                    </span>
                  </div>
                </td>
                <td className="py-2 px-3 align-top border-l border-primary/5">
                  <div className={`break-all ${row.type === 'added' ? 'opacity-30' : ''}`}>
                    {row.type === 'added' ? '-' : formatValue(row.oldVal)}
                  </div>
                </td>
                <td className="py-2 px-3 align-top border-l border-primary/5">
                  <div className={`break-all ${row.type === 'removed' ? 'opacity-30' : ''}`}>
                    {row.type === 'removed' ? '-' : formatValue(row.newVal)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
