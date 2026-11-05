import { useState, useRef, type UIEvent } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography
} from "@mui/material";
export default function ConsentDialog({
  open,
  onClose,
  onAccept,
}: {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}) {
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
    if (atEnd && !scrolledToEnd) setScrolledToEnd(true);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Consent for Data Access</DialogTitle>
      <DialogContent
        dividers
        onScroll={handleScroll}
        ref={contentRef}
        sx={{ maxHeight: 420 }}
      >
<Typography variant="body2" >
  You are being granted access to view another person’s sensitive mental health information
  (“Confidential Information”). By accepting this access, you acknowledge and agree that this
  information remains the sole property of the person who shared it (“the Owner”).
</Typography>

<Typography variant="body2" >
  You agree to use the Confidential Information only for the purpose of providing care,
  support, or professional services directly to the Owner. You may not copy, record, screenshot,
  disclose, distribute, sell, or otherwise share any part of this information with anyone else
  without the Owner’s explicit written consent.
</Typography>

<Typography variant="body2" >
  You understand that the information may contain highly personal and sensitive details.
  You agree to maintain strict confidentiality at all times and to protect the data from any
  unauthorized use, access, or disclosure. Any violation of this duty of confidentiality may
  result in immediate loss of access and may expose you to legal or professional consequences
  under applicable privacy and data protection laws (including the EU General Data Protection
  Regulation (GDPR) and, where applicable, healthcare confidentiality regulations).
</Typography>

<Typography variant="body2" >
  You acknowledge that access to this information is temporary and may be revoked at any time
  by the Owner without prior notice. You agree to immediately cease access and delete any
  retained copies or notes derived from the Confidential Information if your access is revoked
  or expires.
</Typography>

<Typography variant="body2" >
  By selecting <strong>“Accept,”</strong> you confirm that you have read, understood, and agree to these terms.
  You are entering into a legally binding confidentiality and data-use agreement between you
  and the Owner of the information.
</Typography>



      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          onClick={onAccept}
          disabled={!scrolledToEnd}
        >
          Accept
        </Button>
      </DialogActions>
    </Dialog>
  );
}