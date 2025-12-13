'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Filter, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColumnFilterPopoverProps {
  column: string;
  values: string[];
  selectedValues: string[];
  onFilterChange: (values: string[]) => void;
}

export function ColumnFilterPopover({
  column,
  values,
  selectedValues,
  onFilterChange,
}: ColumnFilterPopoverProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Get unique values and sort them
  const uniqueValues = useMemo(() => {
    return Array.from(new Set(values.filter(v => v && v.trim() !== '')))
      .sort((a, b) => a.localeCompare(b));
  }, [values]);

  // Filter values based on search
  const filteredValues = useMemo(() => {
    if (!searchTerm) return uniqueValues;
    return uniqueValues.filter(v =>
      v.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [uniqueValues, searchTerm]);

  const handleSelectAll = () => {
    if (selectedValues.length === uniqueValues.length) {
      onFilterChange([]);
    } else {
      onFilterChange(uniqueValues);
    }
  };

  const handleToggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onFilterChange(selectedValues.filter(v => v !== value));
    } else {
      onFilterChange([...selectedValues, value]);
    }
  };

  const isFiltered = selectedValues.length > 0 && selectedValues.length < uniqueValues.length;
  const allSelected = selectedValues.length === uniqueValues.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 w-7 p-0",
            isFiltered && "text-primary"
          )}
        >
          <Filter className={cn("h-3.5 w-3.5", isFiltered && "fill-primary")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${column}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
        <div className="p-2 border-b">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={allSelected}
              onCheckedChange={handleSelectAll}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </label>
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-2 space-y-2">
          {filteredValues.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No results found
            </div>
          ) : (
            filteredValues.map((value) => (
              <div key={value} className="flex items-center space-x-2">
                <Checkbox
                  id={`filter-${value}`}
                  checked={selectedValues.includes(value)}
                  onCheckedChange={() => handleToggleValue(value)}
                />
                <label
                  htmlFor={`filter-${value}`}
                  className="text-sm cursor-pointer flex-1 truncate"
                  title={value}
                >
                  {value}
                </label>
              </div>
            ))
          )}
        </div>
        {isFiltered && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => onFilterChange(uniqueValues)}
            >
              Clear Filter
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
