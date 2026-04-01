"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import ChartCard from "./ChartCard";

const mwData = [
	{ range: "150-200", count: 24 },
	{ range: "200-250", count: 38 },
	{ range: "250-300", count: 56 },
	{ range: "300-350", count: 49 },
	{ range: "350-400", count: 31 },
	{ range: "400-450", count: 18 },
	{ range: "450+", count: 9 },
];

const logpData = [
	{ range: "<0", count: 11 },
	{ range: "0-1", count: 22 },
	{ range: "1-2", count: 44 },
	{ range: "2-3", count: 58 },
	{ range: "3-4", count: 36 },
	{ range: "4-5", count: 19 },
	{ range: "5+", count: 7 },
];

const axisTick = { fontSize: 11, fill: "#94a3b8" };

function ChartTooltip() {
	return {
		contentStyle: {
			backgroundColor: "#0f172a",
			border: "1px solid #334155",
			borderRadius: "10px",
			color: "#e2e8f0",
			fontSize: "12px",
		},
		cursor: { fill: "#1e293b", opacity: 0.35 },
	};
}

export default function ChartsSection() {
	const tooltip = ChartTooltip();

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<ChartCard title="Molecular Weight (MW) Distribution">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={mwData} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
						<CartesianGrid strokeDasharray="4 4" stroke="#1e293b" vertical={false} />
						<XAxis
							dataKey="range"
							axisLine={false}
							tickLine={false}
							tick={axisTick}
							label={{
								value: "MW Range (g/mol)",
								position: "insideBottom",
								offset: -4,
								fill: "#94a3b8",
								fontSize: 11,
							}}
						/>
						<YAxis
							axisLine={false}
							tickLine={false}
							tick={axisTick}
							label={{
								value: "Molecule Count",
								angle: -90,
								position: "insideLeft",
								fill: "#94a3b8",
								fontSize: 11,
								dx: -8,
							}}
						/>
						<Tooltip {...tooltip} />
						<Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
						<Bar dataKey="count" name="MW Distribution" fill="#14b8a6" maxBarSize={48} radius={[4, 4, 0, 0]} />
					</BarChart>
				</ResponsiveContainer>
			</ChartCard>

			<ChartCard title="LogP Distribution">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={logpData} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
						<CartesianGrid strokeDasharray="4 4" stroke="#1e293b" vertical={false} />
						<XAxis
							dataKey="range"
							axisLine={false}
							tickLine={false}
							tick={axisTick}
							label={{
								value: "LogP Range",
								position: "insideBottom",
								offset: -4,
								fill: "#94a3b8",
								fontSize: 11,
							}}
						/>
						<YAxis
							axisLine={false}
							tickLine={false}
							tick={axisTick}
							label={{
								value: "Molecule Count",
								angle: -90,
								position: "insideLeft",
								fill: "#94a3b8",
								fontSize: 11,
								dx: -8,
							}}
						/>
						<Tooltip {...tooltip} />
						<Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
						<Bar dataKey="count" name="LogP Distribution" fill="#38bdf8" maxBarSize={48} radius={[4, 4, 0, 0]} />
					</BarChart>
				</ResponsiveContainer>
			</ChartCard>
		</div>
	);
}
