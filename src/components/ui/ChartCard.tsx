'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from './card';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChartCardProps {
    title: string;
    description?: string;
    data: any[];
    yAxisKey: string;
    dataKeys: {
        key: string;
        color: string;
        label: string;
    }[];
}

export default function ChartCard({
    title,
    description,
    data,
    yAxisKey,
    dataKeys,
}: ChartCardProps) {
    const isMobile = useIsMobile();

    return (
        <Card className="shadow-md border rounded-lg">
            <CardHeader>
                <CardTitle className="text-xl text-primary font-semibold">
                    {title}
                </CardTitle>
                {description && (
                    <CardDescription className="text-muted-foreground text-sm">
                        {description}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic py-8 text-center">
                        Tidak ada data untuk ditampilkan.
                    </div>
                ) : (
                    <div className="w-full h-[300px] sm:h-[350px] md:h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={data}
                                margin={{
                                    top: 10,
                                    right: 20,
                                    left: 10,
                                    bottom: 20,
                                }}
                                barSize={isMobile ? 20 : 24}
                                barGap={isMobile ? 4 : 6}
                            >
                                <CartesianGrid
                                    strokeDasharray="2 2"
                                    stroke="hsl(var(--border))"
                                    horizontal={true}
                                    vertical={false}
                                />
                                <XAxis
                                    type="number"
                                    tick={{ fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    type="category"
                                    dataKey={yAxisKey}
                                    tick={{ fontSize: 12 }}
                                    width={isMobile ? 60 : 70}
                                    interval={0}
                                    tickFormatter={(val: string) =>
                                        isMobile && val.length > 16
                                            ? val.slice(0, 16) + '...'
                                            : val
                                    }
                                />
                                <Tooltip
                                    wrapperClassName="!text-sm"
                                    formatter={(value: any, name: string) => [
                                        value,
                                        name,
                                    ]}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: 12 }}
                                    iconType="square"
                                />
                                {dataKeys.map(({ key, color, label }) => (
                                    <Bar
                                        key={key}
                                        dataKey={key}
                                        fill={color}
                                        name={label}
                                        radius={[4, 4, 4, 4]}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
