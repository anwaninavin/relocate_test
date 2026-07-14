import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { BarChart3 } from "lucide-react";
import { ExportButtons } from "@/features/admin-analytics/export-buttons";
import type { CountedValue } from "@/features/admin-analytics/analytics-dto";

export function CountedTable({
  title,
  valueLabel,
  countLabel = "Count",
  rows,
  filename,
}: {
  title: string;
  valueLabel: string;
  countLabel?: string;
  rows: CountedValue[];
  filename: string;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => rows.filter((r) => r.value.toLowerCase().includes(search.toLowerCase())),
    [rows, search],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>{title}</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-40 text-xs"
          />
          <ExportButtons
            filename={filename}
            title={title}
            columns={[
              { key: "value", label: valueLabel },
              { key: "count", label: countLabel },
            ]}
            rows={filtered}
          />
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <EmptyState icon={BarChart3} title="No data yet" description="Data will appear here once events are collected." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{valueLabel}</TableHead>
                <TableHead className="text-right">{countLabel}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.value}>
                  <TableCell className="max-w-[320px] truncate">{row.value}</TableCell>
                  <TableCell className="text-right">{row.count.toLocaleString("en-IN")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
