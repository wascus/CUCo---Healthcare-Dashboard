import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Stack, Typography, RadioGroup, FormControlLabel, Radio, FormControl, TextField, InputLabel, Select, MenuItem, Button, FormHelperText } from "@mui/material";
import type { RelationshipType, AccessLevel } from "../../../../services/connections";
import { REL_OPTS, ACCESS_OPTS } from "./constants";

export type PersonType = "contact" | "userId" | "userEmail";

export type AddDialogSubmit = {
personType: PersonType;
name?: string;
email?: string;
uid?: string;
userEmail?: string;
relationship: RelationshipType;
accessLevel: AccessLevel;
};

export type AddPersonDialogProps = {
open: boolean;
groupTitle: string;
defaults: { relationship: RelationshipType; accessLevel: AccessLevel };
onClose: () => void;
onSubmit: (payload: AddDialogSubmit) => void;
};
export default function AddPersonDialog({ open, groupTitle, defaults, onClose, onSubmit }: AddPersonDialogProps) {
  const [personType, setPersonType] = React.useState<PersonType>("contact");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [uid, setUid] = React.useState("");
  const [userEmail, setUserEmail] = React.useState("");
  const [relationship, setRelationship] = React.useState<RelationshipType>(defaults.relationship);
  const [accessLevel, setAccessLevel] = React.useState<AccessLevel>(defaults.accessLevel);
  
  React.useEffect(() => {
  if (!open) return;
  setPersonType("contact");
  setName(""); setEmail(""); setUid(""); setUserEmail("");
  setRelationship(defaults.relationship);
  setAccessLevel(defaults.accessLevel);
  }, [open, defaults.relationship, defaults.accessLevel]);
  
  const isValid = personType === "contact" ? Boolean(name.trim()) : personType === "userId" ? Boolean(uid.trim()) : Boolean(userEmail.trim());
  
  const handleSubmit = () => {
  if (!isValid) return;
  onSubmit({ personType, name: name.trim(), email: email.trim() || undefined, uid: uid.trim(), userEmail: userEmail.trim().toLowerCase(), relationship, accessLevel });
  };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>{`Add to ${groupTitle}`}</DialogTitle>
    <DialogContent dividers>
    <Stack spacing={2}>
    <FormControl>
    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Person type</Typography>
    <RadioGroup row value={personType} onChange={(e) => setPersonType(e.target.value as PersonType)}>
    <FormControlLabel value="contact" control={<Radio />} label="New contact" />
    <FormControlLabel value="userId" control={<Radio />} label="Existing user (by ID)" />
    <FormControlLabel value="userEmail" control={<Radio />} label="Existing user (by email)" />
    </RadioGroup>
    </FormControl>
    
    {personType === "contact" && (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
    <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus autoComplete="off" fullWidth />
    <TextField label="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="off" fullWidth />
    </Stack>
    )}
    
    {personType === "userId" && (
    <TextField label="User ID" value={uid} onChange={(e) => setUid(e.target.value)} required autoFocus autoComplete="off" fullWidth />
    )}
    
    {personType === "userEmail" && (
    <FormControl fullWidth>
    <TextField label="User email" type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required autoFocus autoComplete="off" fullWidth />
    <FormHelperText>We’ll connect directly if this email belongs to a registered user; otherwise we’ll add them as a contact.</FormHelperText>
    </FormControl>
    )}
    
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
    <FormControl fullWidth>
    <InputLabel>Relationship</InputLabel>
    <Select label="Relationship" value={relationship} onChange={(e) => setRelationship(e.target.value as any)}>
    {REL_OPTS.map((r) => (
    <MenuItem key={r} value={r}>{r.replace(/_/g, " ").toLowerCase()}</MenuItem>
    ))}
    </Select>
    </FormControl>
    
    <FormControl fullWidth>
    <InputLabel>Access</InputLabel>
    <Select label="Access" value={accessLevel} onChange={(e) => setAccessLevel(e.target.value as any)}>
    {ACCESS_OPTS.map((a) => (
    <MenuItem key={a} value={a}>{a.replace(/_/g, " ").toLowerCase()}</MenuItem>
    ))}
    </Select>
    </FormControl>
    </Stack>
    </Stack>
    </DialogContent>
    <DialogActions>
    <Button onClick={onClose}>Cancel</Button>
    <Button variant="contained" onClick={handleSubmit} disabled={!isValid}>
    {personType === "contact" ? "Add contact" : "Connect user"}
    </Button>
    </DialogActions>
    </Dialog>
    );
    }
    