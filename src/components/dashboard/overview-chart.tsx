"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"

const data = [
    { name: "Jan", income: 400000, expense: 240000 },
    { name: "Feb", income: 300000, expense: 139800 },
    { name: "Mar", income: 200000, expense: 980000 }, // Loss example
    { name: "Apr", income: 278000, expense: 390800 },
    { name: "May", income: 189000, expense: 480000 },
    { name: "Jun", income: 239000, expense: 380000 },
    { name: "Jul", income: 349000, expense: 430000 },
]

export function OverviewChart() {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `฿${value}`}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                />
                <Legend />
                <Bar dataKey="income" fill="var(--chart-1)" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expense" fill="var(--chart-2)" radius={[4, 4, 0, 0]} name="Expense" />
            </BarChart>
        </ResponsiveContainer>
    )
}
