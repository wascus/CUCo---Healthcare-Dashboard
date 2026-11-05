import { useState } from "react";
import "./ManageAccount.css";

import AccountTab from "./AccountTab";
import SecurityTab from "./SecurityTab";
import HistoryTab from "./HistoryTab";

const TABS = ["account", "security", "history"] as const;
type Tab = typeof TABS[number];

export default function ManageAccount() {
  const [tab, setTab] = useState<Tab>("account");

  return (
    <div className="ma container">
      <aside className="ma sidenav">
        <div className="ma title">Manage account</div>
        {TABS.map((t) => (
          <button
            key={t}
            className={`ma navbtn ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
            aria-current={tab === t ? "page" : undefined}
          >
            {t}
          </button>
        ))}
      </aside>

      <main className="ma content">
        {tab === "account" && <AccountTab />}
        {tab === "security" && <SecurityTab />}
        {tab === "history" && <HistoryTab />}
      </main>
    </div>
  );
}
