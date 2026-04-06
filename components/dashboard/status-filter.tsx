"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STATUS_LABELS } from "@/lib/constants";

const FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "NEW", label: STATUS_LABELS.NEW },
  { value: "QUOTED", label: STATUS_LABELS.QUOTED },
  { value: "PENDING_CUSTOMER", label: STATUS_LABELS.PENDING_CUSTOMER },
  { value: "CLOSED", label: STATUS_LABELS.CLOSED },
];

export function StatusFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList className="flex-wrap h-auto">
        {FILTER_OPTIONS.map((option) => (
          <TabsTrigger key={option.value} value={option.value} className="text-xs">
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
