import * as React from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  FormControlLabel,
  Switch,
  CircularProgress,
  Stack,
  Chip,
  Button,
  Tooltip,
  LinearProgress,
  Alert,
  TextField,
  Divider,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Slide from "@mui/material/Slide";
import type { TransitionProps } from "@mui/material/transitions";
import { styled } from "@mui/material/styles";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import TerrainRoundedIcon from "@mui/icons-material/TerrainRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";

import TitleRoundedIcon from "@mui/icons-material/TitleRounded";
import FormatBoldRoundedIcon from "@mui/icons-material/FormatBoldRounded";
import FormatItalicRoundedIcon from "@mui/icons-material/FormatItalicRounded";
import StrikethroughSRoundedIcon from "@mui/icons-material/StrikethroughSRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { apiFetch } from "../../../../services/api";
import type { Topic } from "../../../../types/grief";

/* -------- transition -------- */
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function isAbort(e: any) {
  return e?.name === "AbortError" || e?.code === 20 || /aborted/i.test(e?.message || "");
}

/* -------- styles -------- */
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": { borderRadius: 16 },
  "& .MuiDialogContent-root": { padding: theme.spacing(2.5) },
  "& .MuiDialogActions-root": { padding: theme.spacing(2) },
}));

/* markdown helpers */
function useMdEditorHelpers(
  value: string,
  setValue: (v: string) => void,
  ref: React.MutableRefObject<HTMLTextAreaElement | null>
) {
  const getSel = () => {
    const el = ref.current;
    if (!el) return { start: 0, end: 0 };
    return { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
  };
  const setSel = (start: number, end = start) => {
    const el = ref.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, end);
    });
  };
  const replaceSel = (fn: (selected: string) => { text: string; caretStart?: number; caretEnd?: number }) => {
    const { start, end } = getSel();
    const selected = value.slice(start, end);
    const res = fn(selected);
    const next = value.slice(0, start) + res.text + value.slice(end);
    setValue(next);
    const newStart = start + (res.caretStart ?? res.text.length);
    const newEnd = start + (res.caretEnd ?? res.caretStart ?? res.text.length);
    setSel(newStart, newEnd);
  };
  const wrap = (left: string, right = left, placeholder = "text") =>
    replaceSel((sel) => {
      const content = sel || placeholder;
      return { text: `${left}${content}${right}`, caretStart: left.length, caretEnd: left.length + content.length };
    });
  const prefixLines = (prefix: string) =>
    replaceSel((sel) => {
      const s = sel || "item";
      const lines = s.split("\n").map((l) => (l.startsWith(prefix) ? l : `${prefix}${l}`));
      return { text: lines.join("\n") };
    });
  const heading = (level = 1) =>
    replaceSel((sel) => {
      const s = sel || "Heading";
      const hashes = "#".repeat(Math.min(6, Math.max(1, level)));
      return { text: `${hashes} ${s}` };
    });
  const link = () =>
    replaceSel((sel) => {
      const label = sel || "link text";
      return { text: `[${label}](https://)`, caretStart: label.length + 3, caretEnd: label.length + 11 };
    });
  const codeInline = () => wrap("`", "`", "code");
  const codeBlock = () => replaceSel((sel) => ({ text: "```\n" + (sel || "code") + "\n```" }));
  return { wrap, prefixLines, heading, link, codeInline, codeBlock };
}

/* -------- helpers -------- */
function formatDateShort(input?: string | null): string {
  if (!input) return "No date";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "No date";
  return d.toLocaleDateString();
}
function formatDateLong(input?: string | null): string {
  if (!input) return "—";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

/* -------- props -------- */
type Props = {
  open: boolean;
  topic: Topic | null;
  onClose: () => void;
  onChanged?: () => void;
  placeholder?: string;
};

/* -------- component -------- */
export default function TopicDetailDialog({
  open,
  topic,
  onClose,
  onChanged,
  placeholder,
}: Props) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [shared, setShared] = React.useState<boolean>(!!topic?.shared);

  const [description, setDescription] = React.useState<string>("");
  const [editing, setEditing] = React.useState<boolean>(true);

  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  const { wrap, prefixLines, heading, link, codeInline, codeBlock } = useMdEditorHelpers(
    description,
    setDescription,
    textareaRef
  );

  const effectivePlaceholder =
    (placeholder && placeholder.trim()) || "Click to add a description…";

  React.useEffect(() => {
    setShared(!!topic?.shared);
    setError(null);
    setDescription((topic as any)?.description ?? "");
    setEditing(true);
  }, [topic?.id]);

  /* keep editing true while focus remains inside DialogContent */
  const handleContentFocus = () => setEditing(true);
  const handleContentBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as HTMLElement | null;
    if (next && contentRef.current?.contains(next)) return; // still inside
    setEditing(false); // left content entirely
  };

  const focusEditor = () => {
    textareaRef.current?.focus();
  };

  async function handleToggle(next: boolean) {
    if (!topic) return;
    setPending(true);
    setError(null);
    try {
      await apiFetch(`/v1/grief/topics/${topic.id}/shared`, {
        method: "PATCH",
        body: JSON.stringify({ shared: next }),
      });
      setShared(next);
      onChanged?.();
    } catch (e: any) {
      if (!isAbort(e)) setError(e?.message ?? "Failed to update");
    } finally {
      setPending(false);
    }
  }

  async function handleSave() {
    if (!topic) return onClose();
    try {
      setPending(true);
      await apiFetch(`/v1/grief/topics/${topic.id}/description`, {
        method: "PATCH",
        body: JSON.stringify({ description: description.trim() || null }),
      });
      onChanged?.();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save");
    } finally {
      setPending(false);
    }
  }

  const handleRequestClose = (_e: object, reason: "backdropClick" | "escapeKeyDown") => {
    if (reason === "backdropClick") return;
    onClose();
  };

  const statusLabel = topic?.status ?? "—";
  const placementLabel = topic?.placement ?? "—";

  // Use canonical timestamps from API
  const createdAt = (topic as any)?.createdAt ?? null;
  const updatedAt = (topic as any)?.updatedAt ?? null;

  return (
    <BootstrapDialog
      fullWidth
      maxWidth="md"
      open={open}
      onClose={handleRequestClose}
      TransitionComponent={Transition}
      aria-labelledby="topic-detail-title"  // points to the inner <h2/>
    >
      {/* DialogTitle now renders a DIV to avoid nesting headings */}
      <DialogTitle component="div" sx={{ pr: 10 }}>
        <Typography
          id="topic-detail-title"
          variant="h6"
          component="h2"
          sx={{ fontWeight: 700 }}
          noWrap
        >
          {topic?.title ?? "Topic details"}
        </Typography>

        {topic && (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
            <Chip size="small" icon={<TerrainRoundedIcon fontSize="small" />} label={`Placement: ${placementLabel}`} />
            <Chip size="small" icon={<FactCheckRoundedIcon fontSize="small" />} label={`Status: ${statusLabel}`} />
            <Tooltip title={formatDateLong(createdAt)}>
              <Chip size="small" icon={<EventRoundedIcon fontSize="small" />} label={`Created: ${formatDateShort(createdAt)}`} />
            </Tooltip>
            <Tooltip title={formatDateLong(updatedAt)}>
              <Chip size="small" icon={<EventRoundedIcon fontSize="small" />} label={`Updated: ${formatDateShort(updatedAt)}`} />
            </Tooltip>
            <Chip
              size="small"
              color={shared ? "success" : "default"}
              variant={shared ? "filled" : "outlined"}
              icon={shared ? <PublicRoundedIcon fontSize="small" /> : <LockRoundedIcon fontSize="small" />}
              label={shared ? "Shared" : "Private"}
            />
          </Stack>
        )}

        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={(theme) => ({
            position: "absolute",
            right: theme.spacing(1),
            top: theme.spacing(1),
            color: theme.palette.grey[500],
          })}
        >
          <CloseIcon />
        </IconButton>

        {pending && <LinearProgress sx={{ mt: 1 }} />}
      </DialogTitle>

      <DialogContent
        dividers
        ref={contentRef}
        onFocus={handleContentFocus}
        onBlur={handleContentBlur}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* formatting toolbar */}
        <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
          <Tooltip title="Heading"><span>
            <IconButton size="small" onClick={() => { focusEditor(); heading(1); }} sx={{ mr: 0.5 }}>
              <TitleRoundedIcon fontSize="small" />
            </IconButton>
          </span></Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <Tooltip title="Bold"><span>
            <IconButton size="small" onClick={() => { focusEditor(); wrap("**", "**", "bold"); }} sx={{ mr: 0.5 }}>
              <FormatBoldRoundedIcon fontSize="small" />
            </IconButton>
          </span></Tooltip>
          <Tooltip title="Italic"><span>
            <IconButton size="small" onClick={() => { focusEditor(); wrap("*", "*", "italic"); }} sx={{ mr: 0.5 }}>
              <FormatItalicRoundedIcon fontSize="small" />
            </IconButton>
          </span></Tooltip>
          <Tooltip title="Strikethrough"><span>
            <IconButton size="small" onClick={() => { focusEditor(); wrap("~~", "~~", "strike"); }} sx={{ mr: 0.5 }}>
              <StrikethroughSRoundedIcon fontSize="small" />
            </IconButton>
          </span></Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <Tooltip title="Bulleted list"><span>
            <IconButton size="small" onClick={() => { focusEditor(); prefixLines("- "); }} sx={{ mr: 0.5 }}>
              <FormatListBulletedRoundedIcon fontSize="small" />
            </IconButton>
          </span></Tooltip>
          <Tooltip title="Numbered list"><span>
            <IconButton size="small" onClick={() => { focusEditor(); prefixLines("1. "); }} sx={{ mr: 0.5 }}>
              <FormatListNumberedRoundedIcon fontSize="small" />
            </IconButton>
          </span></Tooltip>
          <Tooltip title="Quote"><span>
            <IconButton size="small" onClick={() => { focusEditor(); prefixLines("> "); }} sx={{ mr: 0.5 }}>
              <FormatQuoteRoundedIcon fontSize="small" />
            </IconButton>
          </span></Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <Tooltip title="Inline code"><span>
            <IconButton size="small" onClick={() => { focusEditor(); codeInline(); }} sx={{ mr: 0.5 }}>
              <CodeRoundedIcon fontSize="small" />
            </IconButton>
          </span></Tooltip>
          <Tooltip title="Code block"><span>
            <IconButton size="small" onClick={() => { focusEditor(); codeBlock(); }} sx={{ mr: 0.5 }}>
              <CodeRoundedIcon fontSize="small" />
            </IconButton>
          </span></Tooltip>
          <Tooltip title="Link"><span>
            <IconButton size="small" onClick={() => { focusEditor(); link(); }} sx={{ mr: 0.5 }}>
              <LinkRoundedIcon fontSize="small" />
            </IconButton>
          </span></Tooltip>

          <Box sx={{ flex: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {editing ? "Editing (leave this area to preview)" : "Preview (click to edit)"}
          </Typography>
        </Stack>

        {/* Editor or Preview */}
        {editing ? (
          <TextField
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={10}
            autoComplete="off"
            placeholder={effectivePlaceholder}
            inputRef={textareaRef}
            inputProps={{ "aria-label": "Topic description" }}
          />
        ) : (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              minHeight: 200,
              cursor: "text",
              "& ul, & ol": { pl: 3 },
              "& pre": { p: 1, overflow: "auto" },
              "& code": (theme) => ({
                bgcolor: theme.palette.action.hover,
                px: 0.5,
                borderRadius: 1,
              }),
            }}
            onClick={() => { setEditing(true); requestAnimationFrame(() => textareaRef.current?.focus()); }}
            role="button"
            aria-label="Preview. Click to edit."
          >
            {description.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
            ) : (
              <Typography variant="body2" color="text.disabled">
                {effectivePlaceholder}
              </Typography>
            )}
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
        <Tooltip
          title={shared ? "This topic is visible to your approved viewers" : "Only you can see this topic"}
          placement="top"
        >
          <FormControlLabel
            label={pending ? "Saving…" : "Share with connections"}
            labelPlacement="start"
            control={
              pending ? (
                <CircularProgress size={20} />
              ) : (
                <Switch
                  checked={!!shared}
                  onChange={(e) => handleToggle(e.target.checked)}
                  inputProps={{ "aria-label": "Share with connections" }}
                />
              )
            }
            sx={{ m: 0 }}
          />
        </Tooltip>

        <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </Box>
      </DialogActions>
    </BootstrapDialog>
  );
}
