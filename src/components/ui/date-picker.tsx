import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface DatePickerProps {
  selected?: Date | null;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selected,
  onSelect,
  placeholder = "Pick a date"
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected || undefined}
          onSelect={onSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};