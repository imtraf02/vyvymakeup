import { Roboto } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const roboto = Roboto({
	subsets: ["latin", "vietnamese"],
	weight: ["100", "300", "400", "500", "700", "900"],
	variable: "--font-sans",
});

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="vi"
			suppressHydrationWarning
			className={cn("antialiased", roboto.variable)}
		>
			<body className={cn("min-h-screen bg-background", roboto.variable)}>
				<ThemeProvider>
					<TooltipProvider>{children}</TooltipProvider>
					<Toaster />
				</ThemeProvider>
			</body>
		</html>
	);
}
