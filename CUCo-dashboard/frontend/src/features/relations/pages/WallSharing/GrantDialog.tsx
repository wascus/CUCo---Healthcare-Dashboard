import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Stack, FormControl, InputLabel, Select, MenuItem, Typography, Switch, Button, TextField, FormHelperText } from "@mui/material";
import type { AccessLevel } from "../../../../services/connections";
import { addMinutesToLocalString } from "./time";

export type GrantLevel = Exclude<AccessLevel, "NONE" | "CUSTOM">;

export type GrantDialogProps = {
open: boolean;
defaultLevel: GrantLevel;
withExpiry: boolean;
at: string; // datetime-local string
onClose: () => void;
onApply: (opts: { level: GrantLevel; withExpiry: boolean; at: string }) => void;
};

export default function GrantDialog({ open, defaultLevel, withExpiry, at, onClose, onApply }: GrantDialogProps) {
const [level, setLevel] = React.useState<GrantLevel>(defaultLevel);
const [expiryOn, setExpiryOn] = React.useState<boolean>(withExpiry);
const [when, setWhen] = React.useState<string>(at);

React.useEffect(() => {
if (!open) return;
setLevel(defaultLevel);
setExpiryOn(withExpiry);
setWhen(at);
}, [open, defaultLevel, withExpiry, at]);

const shift = (minutes: number) => setWhen((w) => addMinutesToLocalString(w, minutes));

return (
<Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
<DialogTitle>Custom access</DialogTitle>
<DialogContent dividers>
<Stack spacing={2}>
<FormControl fullWidth>
<InputLabel>Base access</InputLabel>
<Select label="Base access" value={level} onChange={(e) => setLevel(e.target.value as GrantLevel)}>
{(["FULL","POSITIVE_ONLY","NEGATIVE_ONLY"] as const).map((a) => (
<MenuItem key={a} value={a}>{a.replace(/_/g, " ").toLowerCase()}</MenuItem>
))}
</Select>
</FormControl>

<Stack direction="row" alignItems="center" justifyContent="space-between">
<Typography variant="subtitle2">Set expiry</Typography>
<Stack direction="row" spacing={1} alignItems="center">
<Typography variant="body2" color="text.secondary">No</Typography>
<Switch checked={expiryOn} onChange={(_, val) => setExpiryOn(val)} />
<Typography variant="body2" color="text.secondary">Yes</Typography>
</Stack>
</Stack>

{expiryOn && (
<>
<Stack spacing={1}>
<Typography variant="subtitle2">Quick duration</Typography>
<Stack direction="row" spacing={1} flexWrap="wrap">
<Button size="small" variant="outlined" onClick={() => shift(60)}>+1h</Button>
<Button size="small" variant="outlined" onClick={() => shift(60*6)}>+6h</Button>
<Button size="small" variant="outlined" onClick={() => shift(60*24)}>+24h</Button>
<Button size="small" variant="outlined" onClick={() => shift(60*24*7)}>+7d</Button>
</Stack>
</Stack>

<TextField label="Expires at" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} autoComplete="off" InputLabelProps={{ shrink: true }} fullWidth />
<FormHelperText>Times are local to your device. You can clear or change the expiry later.</FormHelperText>
</>
)}
</Stack>
</DialogContent>
<DialogActions>
<Button onClick={onClose}>Cancel</Button>
<Button variant="contained" onClick={() => onApply({ level, withExpiry: expiryOn, at: when })}>
{expiryOn ? `Apply timed access` : `Apply without expiry`}
</Button>
</DialogActions>
</Dialog>
);
}
