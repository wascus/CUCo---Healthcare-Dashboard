import * as React from "react";
import {
  Box,
  Typography,
  Chip,
  Stack,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import type { SharedTopic } from "../../../../services/consents";

type Props = {
  topics: SharedTopic[];
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary">{title}</Typography>
      <Divider sx={{ my: 1 }} />
      {children}
    </Box>
  );
}

function TopicRow({ t }: { t: SharedTopic }) {
  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent sx={{ py: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1} justifyContent="space-between">
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap title={t.title}>
              {t.title}
            </Typography>
            {t.description && (
              <Typography variant="body2" color="text.secondary" noWrap title={t.description}>
                {t.description}
              </Typography>
            )}
            <Typography variant="caption" color="text.disabled">
              Updated {t.updatedAt ? new Date(t.updatedAt).toLocaleString() : "—"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexShrink={0}>
            <Chip size="small" label={t.status.toUpperCase()} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function ConsentDetail({ topics }: Props) {
  const byPlacement = React.useMemo(() => {
    const base: SharedTopic[] = [];
    const middle: SharedTopic[] = [];
    const summit: SharedTopic[] = [];
    for (const t of topics) {
      if (t.placement === "base") base.push(t);
      else if (t.placement === "middle") middle.push(t);
      else summit.push(t);
    }
    return { base, middle, summit };
  }, [topics]);

  return (
    <Box>
      <Section title={`Base (${byPlacement.base.length})`}>
        {byPlacement.base.length ? byPlacement.base.map((t) => <TopicRow key={t.id} t={t} />) : (
          <Typography variant="body2" color="text.secondary">No topics at base.</Typography>
        )}
      </Section>

      <Box mt={2} />
      <Section title={`Middle (${byPlacement.middle.length})`}>
        {byPlacement.middle.length ? byPlacement.middle.map((t) => <TopicRow key={t.id} t={t} />) : (
          <Typography variant="body2" color="text.secondary">No topics at middle.</Typography>
        )}
      </Section>

      <Box mt={2} />
      <Section title={`Summit (${byPlacement.summit.length})`}>
        {byPlacement.summit.length ? byPlacement.summit.map((t) => <TopicRow key={t.id} t={t} />) : (
          <Typography variant="body2" color="text.secondary">No topics at summit.</Typography>
        )}
      </Section>
    </Box>
  );
}
