"use client";

import * as React from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Label,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import type { ChartConfig } from "@/components/ui/chart";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useTRPC } from "@/trpc";

const chartConfig = {
  today: {
    label: "Today",
    color: "var(--chart-1)",
  },
  yesterday: {
    label: "Yesterday",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function DashboardTodayTrends() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.dashboard.todayTrends.queryOptions());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s trends</CardTitle>
        <CardAction>
          <div className="flex items-center gap-6">
            <SummaryItem
              label="Resolved"
              value={String(data.summary.resolved)}
            />
            <SummaryItem
              label="Received"
              value={String(data.summary.received)}
            />
            <SummaryItem
              label="Avg First Response"
              value={data.summary.avgFirstResponse}
            />
            <SummaryItem
              label="Resolution within SLA"
              value={`${data.summary.resolutionWithinSla}%`}
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <LineChart
            data={data.hourly}
            margin={{ top: 20, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value: number) => String(value)}
              label={{
                value: "Created date - Hour of the Day",
                position: "insideBottom",
                offset: -4,
                className: "fill-muted-foreground text-xs",
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => `${String(value)}:00`}
                  indicator="dot"
                />
              }
            />
            <Line
              dataKey="today"
              type="linear"
              stroke="var(--color-today)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--color-today)" }}
              activeDot={{ r: 5 }}
            >
              <LabelList
                dataKey="today"
                position="top"
                offset={8}
                className="fill-foreground text-[10px]"
                formatter={(value: number) => (value > 0 ? value : "")}
              />
            </Line>
            <Line
              dataKey="yesterday"
              type="linear"
              stroke="var(--color-yesterday)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--color-yesterday)" }}
              activeDot={{ r: 5 }}
            >
              <LabelList
                dataKey="yesterday"
                position="bottom"
                offset={8}
                className="fill-muted-foreground text-[10px]"
                formatter={(value: number) => (value > 0 ? value : "")}
              />
            </Line>
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="text-muted-foreground text-[10px]">{label}</p>
      <p className="text-foreground text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

// ─── Status Donut Chart ──────────────────────────────────────────────────────

const statusColorMap: Record<string, string> = {
  open: "var(--chart-1)",
  pending: "var(--chart-2)",
  resolved: "var(--chart-3)",
  closed: "var(--chart-4)",
  merged: "var(--chart-5)",
};

const statusChartConfig = {
  count: { label: "Tickets" },
  open: { label: "Open", color: "var(--chart-1)" },
  pending: { label: "Pending", color: "var(--chart-2)" },
  resolved: { label: "Resolved", color: "var(--chart-3)" },
  closed: { label: "Closed", color: "var(--chart-4)" },
  merged: { label: "Merged", color: "var(--chart-5)" },
} satisfies ChartConfig;

export function DashboardStatusChart() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.dashboard.ticketBreakdown.queryOptions());

  const chartData = data.byStatus.map((row) => ({
    status: row.status,
    count: row.count,
    fill: statusColorMap[row.status] ?? "var(--chart-5)",
  }));

  const total = React.useMemo(
    () => chartData.reduce((sum, row) => sum + row.count, 0),
    [chartData]
  );

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Tickets by Status</CardTitle>
        <CardDescription>All active tickets</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={statusChartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {total.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Tickets
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ─── Priority Pie Chart ──────────────────────────────────────────────────────

const priorityColorMap: Record<string, string> = {
  low: "var(--chart-1)",
  normal: "var(--chart-2)",
  high: "var(--chart-3)",
  urgent: "var(--chart-4)",
};

const priorityChartConfig = {
  count: { label: "Tickets" },
  low: { label: "Low", color: "var(--chart-1)" },
  normal: { label: "Normal", color: "var(--chart-2)" },
  high: { label: "High", color: "var(--chart-3)" },
  urgent: { label: "Urgent", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function DashboardPriorityChart() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.dashboard.ticketBreakdown.queryOptions());

  const chartData = data.byPriority.map((row) => ({
    priority: row.priority,
    count: row.count,
    fill: priorityColorMap[row.priority] ?? "var(--chart-5)",
  }));

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Tickets by Priority</CardTitle>
        <CardDescription>All active tickets</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={priorityChartConfig}
          className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="count"
                  hideLabel
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="priority"
            >
              <LabelList
                dataKey="priority"
                className="fill-background"
                stroke="none"
                fontSize={12}
                formatter={(value: string) =>
                  priorityChartConfig[value as keyof typeof priorityChartConfig]?.label ?? value
                }
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
