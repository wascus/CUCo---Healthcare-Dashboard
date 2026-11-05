import { useMemo } from "react";
import { PieChart, ChartContainer, LinePlot, AreaPlot, MarkPlot, ChartsXAxis, ChartsYAxis, ChartsLegend, ChartsTooltip } from "@mui/x-charts";
import { Box, Paper, Typography, useTheme, useMediaQuery } from "@mui/material";
import type { EmotionEntryDTO, EmotionName } from "../../../../services/testsOverview";

interface EmotionChartsProps {
  emotions: EmotionEntryDTO[];
}

const EMOTION_COLORS: Record<EmotionName, string> = {
  Joy: "#fbbf24",
  Sadness: "#3b82f6",
  Anger: "#ef4444",
  Fear: "#6b7280",
  Hope: "#10b981",
  Love: "#ec4899",
  Guilt: "#8b5cf6",
  Acceptance: "#06b6d4",
  Confusion: "#f59e0b",
  Gratitude: "#84cc16",
};

export default function EmotionCharts({ emotions }: EmotionChartsProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // 0. Legend component for all emotions
  const EmotionLegend = () => (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.5,
        justifyContent: "flex-start",
        p: 0,
      }}
    >
      {Object.entries(EMOTION_COLORS).map(([name, color]) => (
        <Box key={name} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color }} />
          <Typography variant="caption" sx={{ fontSize: "0.7rem", fontWeight: 500, color: "#6b7280" }}>
            {name}
          </Typography>
        </Box>
      ))}
    </Box>
  );

  // 1. Prepare data for Line Chart (Intensity over time)
  // Sort by date ascending for the chart
  const sortedEmotions = useMemo(() => {
    return [...emotions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [emotions]);

  const lineDataset = useMemo(() => {
    return sortedEmotions.map((e) => ({
      time: new Date(e.createdAt).getTime(),
      intensity: e.intensity,
      [e.emotion]: e.intensity,
    }));
  }, [sortedEmotions]);

  const intensitySeries = useMemo(() => {
    const distinctEmotions = Array.from(new Set(sortedEmotions.map((e) => e.emotion)));

    const emotionSeries = distinctEmotions.map((emotion) => ({
      dataKey: emotion,
      label: emotion,
      color: EMOTION_COLORS[emotion],
      type: "line" as const,
      disableHighlight: false,
      showMark: true,
      connectNulls: false,
      slotProps: {
        line: {
          strokeWidth: 0,
        },
        mark: {
          fill: EMOTION_COLORS[emotion],
          stroke: "white",
          strokeWidth: 1.5,
          r: 6,
        },
      },
    }));

    // Add a general trend line that connects everything
    const trendLine = {
      dataKey: "intensity",
      label: "Trend",
      color: "url(#emotion-gradient)",
      type: "line" as const,
      strokeWidth: 0,
      area: true,
      curve: "monotoneX" as const,
      connectNulls: true,
      disableHighlight: true,
      showMark: false,
    };

    return [trendLine, ...emotionSeries];
  }, [sortedEmotions]);

  // Generate gradient stops for the emotion-based area fill
  const gradientStops = useMemo(() => {
    if (sortedEmotions.length < 2) return null;
    const firstTime = new Date(sortedEmotions[0].createdAt).getTime();
    const lastTime = new Date(sortedEmotions[sortedEmotions.length - 1].createdAt).getTime();
    const range = lastTime - firstTime;

    if (range === 0) return null;

    return sortedEmotions.map((e) => {
      const offset = ((new Date(e.createdAt).getTime() - firstTime) / range) * 100;
      // Map intensity (1-10) to opacity (0.1 - 0.7)
      const opacity = 0.1 + (e.intensity / 10) * 0.6;
      return (
        <stop
          key={e.id}
          offset={`${offset}%`}
          stopColor={EMOTION_COLORS[e.emotion]}
          stopOpacity={opacity}
        />
      );
    });
  }, [sortedEmotions]);

  // 2. Prepare data for Pie Chart (Emotion distribution)
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of emotions) {
      counts[e.emotion] = (counts[e.emotion] || 0) + 1;
    }

    return Object.entries(counts).map(([label, value], id) => ({
      id,
      value,
      label,
      color: EMOTION_COLORS[label as EmotionName] || "#ccc",
    }));
  }, [emotions]);

  if (emotions.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mb: 4 }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #e5e7eb" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827" }}>
            Emotion Intensity over Time
          </Typography>
          <EmotionLegend />
        </Box>
        <Box sx={{ height: 300, width: "100%", overflow: "hidden" }}>
          <ChartContainer
            width={isMobile ? 320 : 600}
            height={300}
            dataset={lineDataset}
            xAxis={[
              {
                id: "time-axis",
                dataKey: "time",
                scaleType: "time",
                label: "Time",
                valueFormatter: (ts) =>
                  new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              },
            ]}
            yAxis={[{ min: 0, max: 10, label: "Intensity" }]}
            series={intensitySeries as any}
            margin={{ left: 50, right: 10, top: 10, bottom: 40 }}
          >
            <defs>
              <linearGradient id="emotion-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                {gradientStops}
              </linearGradient>
            </defs>
            <AreaPlot />
            <MarkPlot />
            <ChartsXAxis />
            <ChartsYAxis
              slotProps={{
                axisLabel: {
                  transform: "translateX(10px)",
                },
              }}
            />
            <ChartsTooltip />
          </ChartContainer>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #e5e7eb" }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "#111827", mb: 2 }}>
          Emotion Distribution
        </Typography>
        <Box
          sx={{
            height: isMobile ? 400 : 300,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <PieChart
            series={[
              {
                data: pieData,
                highlightScope: { faded: "global", highlighted: "item" },
                faded: { innerRadius: 30, additionalRadius: -30, color: "gray" },
                innerRadius: 60,
                outerRadius: 100,
                paddingAngle: 2,
                cornerRadius: 4,
              },
            ]}
            height={isMobile ? 400 : 300}
            slotProps={{
              legend: {
                direction: isMobile ? "column" : "row",
                position: { vertical: isMobile ? "bottom" : "middle", horizontal: isMobile ? "middle" : "right" },
                padding: 0,
              },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}
