/**
 * app/page.tsx
 * Main page hosting the BillForm and BillPreview in a responsive grid.
 */

"use client";

import { Heart, History, Settings } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { getSettings, getWeddingContractById } from "@/app/actions";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { WeddingContractForm } from "@/components/wedding-contract-form";
import { WeddingContractPreview } from "@/components/wedding-contract-preview";
import type {
	SettingsSchema,
	WeddingContractSchema,
} from "@/lib/schema";
import { mapToWeddingSchema } from "@/lib/utils";

function HomeContent() {
	const searchParams = useSearchParams();
	const editId = searchParams.get("edit");

	const [weddingData, setWeddingData] = React.useState<
		Partial<WeddingContractSchema>
	>({});

	const [initialData, setInitialData] = React.useState<
		Partial<WeddingContractSchema> | undefined
	>();
	const [settings, setSettings] = React.useState<SettingsSchema | undefined>();

	React.useEffect(() => {
		getSettings().then((s) => setSettings(s || undefined));
		if (editId) {
			getWeddingContractById(editId).then((contract) => {
				if (contract) {
					const mapped = mapToWeddingSchema(contract);
					setInitialData(mapped);
				}
			});
		}
	}, [editId]);

	return (
		<main className="min-h-screen bg-theme-bg-body pb-24">
			<div className="container mx-auto p-2">
				<header className="mb-6 no-print space-y-4 md:space-y-0 md:flex md:items-center md:justify-between relative">
					{/* Hàng 1 trên mobile: Logo + Actions */}
					<div className="flex items-center justify-between">
						<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-theme-text-dark">
							VyVy
						</h1>
						<div className="flex items-center gap-1.5 md:hidden">
							{editId && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => (window.location.href = "/")}
								>
									Mới
								</Button>
							)}
							<Button
								variant="outline"
								size="icon"
								className="h-8 w-8 rounded-xl border-theme-border-muted text-theme-text-muted"
								nativeButton={false}
								render={<Link href="/settings" />}
							>
								<Settings className="w-4 h-4" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								className="h-8 w-8 rounded-xl border-theme-border-muted text-theme-text-muted"
								nativeButton={false}
								render={<Link href="/contracts" />}
							>
								<History className="w-4 h-4" />
							</Button>
							<LogoutButton />
						</div>
					</div>

					{/* Desktop Actions */}
					<div className="hidden md:flex items-center gap-2">
						{editId && (
							<Button
								variant="ghost"
								onClick={() => (window.location.href = "/")}
							>
								Tạo mới
							</Button>
						)}
						<Button
							variant="outline"
							className="gap-2 rounded-xl border-theme-border-muted text-theme-text-muted"
							nativeButton={false}
							render={<Link href="/settings" />}
						>
							<Settings className="w-4 h-4" />
							<span className="text-sm">Cài đặt</span>
						</Button>
						<Button
							variant="outline"
							className="gap-2 rounded-xl border-theme-border-muted text-theme-text-muted"
							nativeButton={false}
							render={<Link href="/contracts" />}
						>
							<History className="w-4 h-4" />
							<span className="text-sm">Lịch sử</span>
						</Button>
						<LogoutButton />
					</div>

					{/* Title/Indicator */}
					<div className="flex gap-1.5 w-full md:w-auto md:absolute md:left-1/2 md:-translate-x-1/2">
						<div
							className="flex-1 md:flex-none flex items-center justify-center gap-2 p-2 px-4 rounded-xl text-sm font-bold bg-theme-gold-primary text-white shadow-lg shadow-theme-gold-primary/20"
						>
							<Heart className="w-4 h-4" />
							Hợp đồng Đám cưới
						</div>
					</div>
				</header>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					{/* Left: Form */}
					<div className="no-print">
						<WeddingContractForm onDataChange={setWeddingData} initialData={initialData} />
					</div>

					{/* Right: Preview (Desktop Only) */}
					<div className="hidden lg:block relative">
						<div className="lg:sticky lg:top-10">
							<div className="no-print text-sm font-medium text-muted-foreground mb-4 text-center italic">
								Xem trước hợp đồng
							</div>
							<WeddingContractPreview
								data={weddingData}
								settings={settings}
							/>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}

export default function Home() {
	return (
		<React.Suspense fallback={<div>Đang tải...</div>}>
			<HomeContent />
		</React.Suspense>
	);
}
