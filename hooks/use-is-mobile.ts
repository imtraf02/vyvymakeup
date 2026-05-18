import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Returns true when viewport width is below the mobile breakpoint (768px).
 * Subscribes to resize events and updates reactively.
 */
export function useIsMobile(): boolean {
	const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

	React.useEffect(() => {
		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
		const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
		mql.addEventListener("change", onChange);
		setIsMobile(mql.matches);
		return () => mql.removeEventListener("change", onChange);
	}, []);

	return !!isMobile;
}
