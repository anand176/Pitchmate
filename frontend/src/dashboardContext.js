import { createContext, useContext } from "react";

/**
 * Replaces react-router's useOutletContext(). Pages are rendered inside a
 * nested, location-frozen <Routes> (see DashboardLayout) so route transitions
 * can be animated without remounting the layout shell; that nested Routes
 * can't forward react-router's Outlet `context` prop, so state is threaded
 * through here instead.
 */
export const DashboardContext = createContext(null);

export function useDashboardContext() {
    return useContext(DashboardContext);
}
