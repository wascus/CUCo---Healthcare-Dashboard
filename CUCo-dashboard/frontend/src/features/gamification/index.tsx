import { NavLink, Outlet } from "react-router-dom";
import { Notes as NotesIcon, Assignment as AssignmentIcon, ChatBubbleOutline as ChatBubbleOutlineIcon, CheckCircle as CheckCircleIcon, SportsEsports as SportsEsportsIcon } from "@mui/icons-material";
import "./Layout.css";

export default function GamificationLayout() {
  return (
    <div className="individual-layout">
      <nav className="module-nav">
        <NavLink to="diary" relative="route" className={({ isActive }) => `module-link${isActive ? " active" : ""}`}>
          <NotesIcon sx={{ mr: 0.5 }} /> Diary Wall
        </NavLink>
        <NavLink to="tests" relative="route" className={({ isActive }) => `module-link${isActive ? " active" : ""}`}>
          <AssignmentIcon sx={{ mr: 0.5 }} /> Emotion Tracking
        </NavLink>
        <NavLink to="grief-topics" relative="route" className={({ isActive }) => `module-link${isActive ? " active" : ""}`}>
          <ChatBubbleOutlineIcon sx={{ mr: 0.5 }} /> Grief Topics
        </NavLink>
        {/* <NavLink to="exercises" relative="route" className={({ isActive }) => `module-link${isActive ? " active" : ""}`}>
          Exercises Wall
        </NavLink> */}
        {/* <NavLink to="exercise-preference" relative="route" className={({ isActive }) => `module-link${isActive ? " active" : ""}`}>
          Exercise Preference
        </NavLink> */}
        {/* <NavLink to="social-events" relative="route" className={({ isActive }) => `module-link${isActive ? " active" : ""}`}>
          Social Event Tracker
        </NavLink> */}
        {/* <NavLink to="knowledge" relative="route" className={({ isActive }) => `module-link${isActive ? " active" : ""}`}>
          Knowledge List
        </NavLink> */}
        <NavLink to="activity" relative="route" className={({ isActive }) => `module-link${isActive ? " active" : ""}`}>
          <CheckCircleIcon sx={{ mr: 0.5 }} /> Tasks
        </NavLink>
        <NavLink to="gamification" relative="route" className={({ isActive }) => `module-link${isActive ? " active" : ""}`}>
          <SportsEsportsIcon sx={{ mr: 0.5 }} /> Gamification
        </NavLink>
      </nav>

      <div className="individual-content">
        <Outlet />
      </div>
    </div>
  );
}
