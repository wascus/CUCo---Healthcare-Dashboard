import { NavLink, Outlet } from "react-router-dom";

export default function RelationsLayout() {
  return (
    <div>
      <h1>Relations / Network</h1>

      <nav className="module-nav">
        {/* <NavLink to="graph" className={({ isActive }) => `module-link${isActive ? " active" : ""}`}>
          Graph
        </NavLink> */}
        <NavLink to="consent" className={({ isActive }) => `module-link${isActive ? " active" : ""}`}>
          Consent
        </NavLink>
        {/* <NavLink to="insights" className={({ isActive }) => `module-link${isActive ? " active" : ""}`}>
          Insights
        </NavLink> */}
        {/* <NavLink to="support-circle" className={({ isActive }) => `module-link${isActive ? " active" : ""}`}>
          Support Circle
        </NavLink> */}
        <NavLink to="wall-sharing" className={({ isActive }) => `module-link${isActive ? " active" : ""}`}>
          Wall Sharing
        </NavLink>
        {/* <NavLink to="social-needs" className={({ isActive }) => `module-link${isActive ? " active" : ""}`}>
          Social Needs
        </NavLink> */}
        {/* <NavLink to="social-needs-covered" className={({ isActive }) => `module-link${isActive ? " active" : ""}`}>
          Social Needs Covered
        </NavLink> */}
      </nav>

      <Outlet />
    </div>
  );
}
