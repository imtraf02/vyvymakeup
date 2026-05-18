"use client";

import { format } from "date-fns";
import {
	ArrowLeft,
	Calendar,
	ChevronRight,
	Download,
	Phone,
	Printer,
	Search,
	Trash2,
	Heart,
	Receipt,
	X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { captureElement } from "@/lib/capture";
import Link from "next/link";
import * as React from "react";
import {
	deleteWeddingContract,
	getSettings,
	getWeddingContracts
} from "@/app/actions";
import type { SettingsSchema } from "@/lib/schema";
import { toast } from "sonner";
import { WeddingContractPreview } from "@/components/wedding-contract-preview";
import { mapToWeddingSchema } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";
import { useIsMobile } from "@/hooks/use-is-mobile";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerClose,
} from "@/components/ui/drawer";

export default function ContractsPage() {
	const [contracts, setContracts] = React.useState<any[]>([]);
	const [searchTerm, setSearchTerm] = React.useState("");
	const [paymentFilter, setPaymentFilter] = React.useState<"all" | "pending" | "completed">("all");
	const [selectedContract, setSelectedContract] = React.useState<any | null>(null);
	const [isDownloading, setIsDownloading] = React.useState(false);
	const [settings, setSettings] = React.useState<SettingsSchema | undefined>();
	const [isLoading, setIsLoading] = React.useState(true);
	const isMobile = useIsMobile();

	const loadContracts = async () => {
		setIsLoading(true);
		try {
			const weddingData = await getWeddingContracts();

		// Add type tag to each
		const weddingContracts = weddingData.map(c => ({ ...c, type: 'wedding' }));

		// Combine and sort by date
		const combined = [...weddingContracts].sort((a, b) =>
			new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
		);
			setContracts(combined);
		} finally {
			setIsLoading(false);
		}
	};

	React.useEffect(() => {
		loadContracts();
		getSettings().then((s) => setSettings(s || undefined));
	}, []);

	const handleDelete = async (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (confirm("Bạn có chắc chắn muốn xoá hợp đồng này?")) {
			const res = await deleteWeddingContract(id);
			if (res.success) {
				toast.success("Đã xoá hợp đồng");
				loadContracts();
			} else {
				toast.error("Lỗi: " + res.error);
			}
		}
	};

	const formatCurrency = (amount: any) =>
		new Intl.NumberFormat("vi-VN", {
			style: "currency",
			currency: "VND",
		}).format(Number(amount) || 0);

	const filteredContracts = contracts.filter((c) => {
		// Search
		const matchesSearch =
			c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			c.phone.includes(searchTerm);
		if (!matchesSearch) return false;

		// Payment filter
		if (paymentFilter !== "all") {
			let total = 0;
			const comboTotal = c.wedding_contract_combos?.reduce((acc: number, combo: any) => acc + (Number(combo.base_price) || 0), 0) || 0;
			const extraTotal = c.wedding_contract_extra_services?.reduce((acc: number, s: any) => acc + (Number(s.price) * (Number(s.quantity) || 1)), 0) || 0;
			const subtotal = comboTotal + extraTotal + Number(c.travel_fee) + Number(c.incurred_cost || 0) - (Number(c.discount) || 0);
			total = c.include_vat ? subtotal * 1.1 : subtotal;
			const remaining = total - Number(c.deposit || 0);
			if (paymentFilter === "pending" && remaining <= 0) return false;
			if (paymentFilter === "completed" && remaining > 0) return false;
		}

		return true;
	});

	const onDownloadImage = async () => {
		if (!selectedContract) return;

		try {
			setIsDownloading(true);
			const safeName = (selectedContract.customer_name || "khach-hang")
				.replace(/[^a-z0-9]/gi, "-")
				.toLowerCase();
			const todayStr = format(new Date(), "dd-MM-yyyy");

			await captureElement(
				"wedding-preview-content",
				`${todayStr}-${safeName}`
			);
			toast.success("Đã tạo file ảnh thành công!");
		} catch (err) {
			console.error("Lỗi tạo ảnh:", err);
			toast.error("Không thể tạo file ảnh.");
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<div
			className="min-h-screen pb-20"
			style={{
				background: "linear-gradient(160deg, #fdfaf3 0%, #f5f0e8 100%)",
			}}
		>
			{/* ── Sticky Header ── */}
			<div
				className="sticky top-0 z-10 no-print bg-theme-bg-body/90 backdrop-blur-md border-b border-theme-border"
			>
				{/* Top bar */}
				<div className="flex items-center gap-3 p-2 max-w-2xl mx-auto">
					<Button
						variant="outline"
						size="sm"
						className="w-9 h-9 p-0 rounded-xl flex items-center justify-center border border-theme-border-muted bg-theme-bg-muted hover:bg-theme-border-muted text-theme-text-muted transition-colors -ml-1"
						nativeButton={false}
						render={<Link href="/" />}
					>
						<ArrowLeft className="w-4 h-4" />
					</Button>

					<div className="flex items-center gap-2.5 ml-1">
						<div className="h-5 w-px bg-theme-border-muted" />
						<h1
							className="text-lg font-bold tracking-wide text-theme-text-dark"
						>
							Lịch sử hợp đồng
						</h1>
					</div>

					<div className="ml-auto flex items-center gap-1.5">
						<div className="bg-gradient-to-r from-theme-gold-primary to-theme-gold-light text-white rounded-full px-2 py-1 shadow-sm flex items-center gap-1">
							<span className="text-xs font-bold">{filteredContracts.length}</span>
							<span className="text-[10px] opacity-80">hợp đồng</span>
						</div>
						<LogoutButton />
					</div>
				</div>

				{/* Search */}
				<div className="p-2 max-w-2xl mx-auto">
					<div className="relative">
						<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-gold-primary" />
						<input
							placeholder="Tìm theo tên hoặc số điện thoại..."
							className="w-full h-10 pl-10 pr-4 rounded-xl border border-theme-border-muted bg-white/80 text-sm text-theme-text-dark placeholder:text-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-gold-primary/40 focus:border-theme-gold-primary transition-all"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
				</div>

				{/* Filters */}
				<div className="px-2 pb-3 max-w-2xl mx-auto space-y-2.5">
					<div className="flex flex-wrap gap-1.5 items-center">
						<span className="text-[10px] font-black uppercase tracking-widest text-theme-text-muted mr-1.5">Thanh toán:</span>
						{[
							{ id: "all", label: "Tất cả" },
							{ id: "pending", label: "Còn nợ" },
							{ id: "completed", label: "Xong" },
						].map((f) => (
							<button
								key={f.id}
								onClick={() => setPaymentFilter(f.id as any)}
								className={cn(
									"px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
									paymentFilter === f.id
										? "bg-theme-gold-primary text-white shadow-sm"
										: "bg-white border border-theme-border-muted text-theme-text-muted"
								)}
							>
								{f.label}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* ── Contract list ── */}
			<div className="p-2 max-w-2xl mx-auto space-y-3 no-print">
				{isLoading ? (
					Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="rounded-2xl border border-theme-border bg-white overflow-hidden p-2 animate-pulse">
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-slate-100" />
									<div className="space-y-2">
										<div className="h-4 bg-slate-100 rounded w-32" />
										<div className="h-3 bg-slate-50 rounded w-24" />
									</div>
								</div>
								<div className="space-y-2 text-right">
									<div className="h-4 bg-slate-100 rounded w-20 ml-auto" />
									<div className="h-3 bg-slate-50 rounded w-16 ml-auto" />
								</div>
							</div>
						</div>
					))
				) : filteredContracts.length === 0 ? (
					<div className="text-center py-20">
						<div className="w-16 h-16 rounded-2xl bg-theme-bg-muted border border-theme-border flex items-center justify-center mx-auto mb-4">
							<Receipt className="w-7 h-7 text-theme-gold-primary opacity-50" />
						</div>
						<p className="font-semibold text-theme-text-muted text-sm">Không tìm thấy hợp đồng nào</p>
						<p className="text-xs text-theme-text-muted mt-1">Thử tìm kiếm với từ khoá khác</p>
					</div>
				) : (
					filteredContracts.map((contract, i) => {
						let total = 0;
						const comboTotal = contract.wedding_contract_combos?.reduce((acc: number, c: any) => {
							return acc + (Number(c.base_price) || 0);
						}, 0) || 0;
						const extraTotal = contract.wedding_contract_extra_services?.reduce((acc: number, s: any) => {
							return acc + (Number(s.price) * (Number(s.quantity) || 1));
						}, 0) || 0;
						const subtotal = comboTotal + extraTotal + Number(contract.travel_fee) + Number(contract.incurred_cost || 0) - (Number(contract.discount) || 0);
						total = contract.include_vat ? subtotal * 1.1 : subtotal;
						const remaining = total - Number(contract.deposit || 0);

						return (
							<div
								key={`${contract.type}-${contract.id}`}
								className="rounded-2xl border border-theme-border bg-white overflow-hidden cursor-pointer group transition-all duration-200 hover:border-theme-gold-primary hover:shadow-[0_4px_20px_0_rgba(200,168,75,0.15)]"
								style={{ animationDelay: `${i * 40}ms` }}
								onClick={() => setSelectedContract(contract)}
							>
								{/* Gold accent line on hover */}
								<div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-theme-gold-primary via-theme-gold-light to-theme-gold-primary transition-all duration-300" />

								{/* Main content */}
								<div className="flex items-start justify-between p-2">
									{/* Left: avatar + info */}
									<div className="flex items-center gap-3 min-w-0">
										<div className="w-10 h-10 rounded-full border flex items-center justify-center shrink-0 bg-red-50 border-red-100 text-red-500">
											<Heart className="w-4 h-4" />
										</div>
										<div className="min-w-0">
											<div className="flex items-center gap-1.5">
												<p className="font-semibold text-theme-text-dark text-sm leading-tight truncate">
													{contract.customer_name}
												</p>
												<span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase bg-red-100 text-red-600">
													Hợp đồng cưới
												</span>
											</div>
											<p className="text-[11px] text-theme-text-muted mt-0.5 flex items-center gap-1">
												<Phone className="w-3 h-3 text-theme-gold-primary" />
												{contract.phone}
											</p>
										</div>
									</div>

									{/* Right: amounts */}
									<div className="text-right shrink-0 ml-2">
										<p className="font-bold text-sm text-theme-gold-primary">
											{formatCurrency(total)}
										</p>
										<p className="text-[10px] text-theme-text-muted mt-0.5">
											Còn:{" "}
											<span className={remaining > 0 ? "text-red-500 font-semibold" : "text-emerald-600 font-semibold"}>
												{formatCurrency(remaining)}
											</span>
										</p>
									</div>
								</div>

								{/* Dashed divider */}
								<div className="border-t border-dashed border-theme-border mx-4" />

								{/* Bottom row: dates + actions */}
								<div className="flex items-center justify-between p-2">
									<div className="flex gap-3 text-[11px] text-theme-text-muted">
										<span className="flex items-center gap-1">
											<Calendar className="w-3 h-3 text-theme-gold-primary" />
											Lập: {format(new Date(contract.contract_date), "dd/MM/yy")}
										</span>
										<span className="flex items-center gap-1">
											<Calendar className="w-3 h-3 text-theme-gold-light" />
											Sự kiện: {format(new Date(contract.wedding_date), "dd/MM/yy")}
										</span>
									</div>

									{/* Action buttons */}
									<div className="flex items-center gap-0.5">
										<button
											className="flex items-center gap-1 text-[11px] font-semibold text-theme-text-muted hover:text-theme-gold-hover px-2.5 py-1.5 rounded-lg hover:bg-theme-bg-muted transition-colors"
											onClick={(e) => {
												e.stopPropagation();
												setSelectedContract(contract);
											}}
										>
											Xem
											<ChevronRight className="w-3 h-3" />
										</button>

										<button
											className="w-7 h-7 rounded-lg flex items-center justify-center text-theme-text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
											onClick={(e) => handleDelete(contract.id, e)}
											title="Xoá"
										>
											<Trash2 className="w-3.5 h-3.5" />
										</button>
									</div>
								</div>
							</div>
						);
					})
				)}
			</div>

			{/* ── Preview Overlay ── */}
			{selectedContract && (
				<>
					{isMobile ? (
						<Drawer open={!!selectedContract} onOpenChange={(open) => !open && setSelectedContract(null)}>
							<DrawerContent className="h-[95vh] bg-theme-bg-body">
								<DrawerHeader className="border-b border-theme-border pb-2 shrink-0">
									<div className="flex items-center justify-between">
										<DrawerTitle className="text-sm font-bold text-theme-gold-hover uppercase tracking-widest">Xem lại hợp đồng</DrawerTitle>
										<DrawerClose asChild>
											<button className="w-8 h-8 flex items-center justify-center rounded-full bg-theme-bg-muted text-theme-text-muted">
												<X className="w-4 h-4" />
											</button>
										</DrawerClose>
									</div>
								</DrawerHeader>
								<div className="flex-1 overflow-auto p-2 pb-24 flex justify-center">
									<WeddingContractPreview data={mapToWeddingSchema(selectedContract)} settings={settings} />
								</div>
								<div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-theme-border p-2 flex gap-2 justify-end safe-area-bottom">
									<button
										onClick={onDownloadImage}
										disabled={isDownloading}
										className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl border border-theme-border-muted bg-white font-bold text-[11px] text-theme-gold-hover shadow-sm active:bg-theme-bg-muted disabled:opacity-60 transition-all"
									>
										<Download className="w-4 h-4" />
										{isDownloading ? "Đang tạo..." : "TẢI ẢNH"}
									</button>
									<button
										onClick={() => window.print()}
										className="flex-[1.5] h-12 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-theme-gold-primary to-theme-gold-light font-bold text-[11px] text-white shadow-lg active:opacity-90 transition-all"
									>
										<Printer className="w-4 h-4" />
										IN LẠI
									</button>
								</div>
							</DrawerContent>
						</Drawer>
					) : (
						<div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2 animate-in fade-in duration-200">
							{/* Backdrop */}
							<div
								className="absolute inset-0 bg-black/50 backdrop-blur-sm"
								onClick={() => setSelectedContract(null)}
							/>

							{/* Modal */}
							<div className="relative bg-white rounded-3xl w-full max-w-4xl max-h-full overflow-hidden flex flex-col shadow-2xl no-print border border-theme-border">
								{/* Modal header */}
								<div className="flex items-center justify-between p-2 border-b border-theme-border bg-gradient-to-r from-theme-bg-muted to-white">
									<div className="flex items-center gap-2">
										<div className="h-4 w-px bg-theme-gold-primary" />
										<h2 className="font-bold text-theme-text-dark">Xem lại hợp đồng</h2>
									</div>

									<div className="flex items-center gap-2">
										<button
											onClick={onDownloadImage}
											disabled={isDownloading}
											className="flex items-center gap-1.5 text-xs font-semibold text-theme-gold-hover border border-theme-border-muted rounded-xl px-3 py-2 bg-white hover:bg-theme-bg-muted transition-all disabled:opacity-60"
										>
											<Download className="w-3.5 h-3.5" />
											{isDownloading ? "Đang tạo..." : "Tải ảnh"}
										</button>
										<button
											onClick={() => window.print()}
											className="flex items-center gap-1.5 text-xs font-semibold text-theme-text-muted border border-theme-border-muted rounded-xl px-3 py-2 bg-theme-bg-muted hover:bg-theme-border-muted hover:border-theme-gold-primary transition-all"
										>
											<Printer className="w-3.5 h-3.5" />
											In lại
										</button>
										<button
											onClick={() => setSelectedContract(null)}
											className="w-8 h-8 rounded-xl flex items-center justify-center border border-theme-border-muted bg-theme-bg-muted hover:bg-theme-border-muted text-theme-text-muted transition-colors"
										>
											<X className="w-4 h-4 rotate-[270deg]" />
										</button>
									</div>
								</div>

								{/* Preview content */}
								<div className="flex-1 overflow-auto p-2 flex justify-center bg-theme-bg-body">
									<WeddingContractPreview data={mapToWeddingSchema(selectedContract)} settings={settings} />
								</div>
							</div>
						</div>
					)}

					{/* Print only */}
					<div className="hidden print:block fixed inset-0 bg-white z-[10000]">
						<WeddingContractPreview data={mapToWeddingSchema(selectedContract)} settings={settings} />
					</div>
				</>
			)}
		</div>
	);
}