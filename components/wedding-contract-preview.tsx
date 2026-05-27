"use client";

import { format } from "date-fns";
import {
	Landmark,
	Mail,
	MapPin,
	MessageSquare,
	Phone,
	User,
} from "lucide-react";
import * as React from "react";
import type { SettingsSchema, WeddingContractSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";

interface WeddingContractPreviewProps {
	data: Partial<WeddingContractSchema>;
	settings?: SettingsSchema;
}

export function WeddingContractPreview({
	data,
	settings,
}: WeddingContractPreviewProps) {
	const [scale, setScale] = React.useState(1);
	const containerRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		const updateScale = () => {
			if (containerRef.current) {
				const containerWidth =
					containerRef.current.parentElement?.clientWidth || 0;
				if (containerWidth < 559) {
					setScale(containerWidth / 559);
				} else {
					setScale(1);
				}
			}
		};
		updateScale();
		window.addEventListener("resize", updateScale);
		return () => window.removeEventListener("resize", updateScale);
	}, []);

	const formatCurrency = (amount: number = 0) => {
		if (!amount) return "0";
		return new Intl.NumberFormat("vi-VN").format(amount);
	};

	const formatDate = (date?: Date) => {
		if (!date) return "";
		return format(date, "dd/MM/yyyy");
	};

	const calculateComboTotal = (combo: { basePrice?: number }) =>
		Number(combo.basePrice) || 0;
	const calculateServiceTotal = (svc: { price?: number; quantity?: number }) =>
		Number(svc.price) * (Number(svc.quantity) || 1) || 0;
	const mediaTotal = (data.mediaServices || []).reduce(
		(acc, svc) => acc + calculateServiceTotal(svc),
		0,
	);
	const extraTotal = (data.extraServices || []).reduce(
		(acc, svc) => acc + calculateServiceTotal(svc),
		0,
	);

	const subtotalBeforeDiscount =
		(data.combos || []).reduce(
			(acc, combo) => acc + calculateComboTotal(combo),
			0,
		) +
		mediaTotal +
		extraTotal +
		(Number(data.travelFee) || 0) +
		(Number(data.incurredCost) || 0);
	const subtotal = subtotalBeforeDiscount - (Number(data.discount) || 0);
	const vatAmount = data.includeVAT ? subtotal * 0.1 : 0;
	const totalPrice = subtotal + vatAmount;
	const remaining = totalPrice - (Number(data.deposit) || 0);

	const today = new Date();
	const day = today.getDate().toString().padStart(2, "0");
	const month = (today.getMonth() + 1).toString().padStart(2, "0");
	const year = today.getFullYear();

	return (
		<div
			ref={containerRef}
			className="w-full flex justify-center overflow-hidden print:overflow-visible"
		>
			<style jsx global>{`
				@media print {
					@page { size: A5; margin: 0; }
					body {
						-webkit-print-color-adjust: exact !important;
						print-color-adjust: exact !important;
						background-color: white !important;
						margin: 0 !important;
						padding: 0 !important;
					}
					#wedding-preview-content {
						box-shadow: none !important;
						margin: 0 !important;
						transform: none !important;
						position: fixed !important;
						top: 0 !important; left: 0 !important;
						width: 148mm !important;
						height: 210mm !important;
						z-index: 99999 !important;
						background-color: white !important;
						-webkit-print-color-adjust: exact !important;
						print-color-adjust: exact !important;
					}
					.no-print, [data-sonner-toaster], .sonner-toast { display: none !important; }
				}
			`}</style>

			<div
				id="wedding-preview-content"
				className={cn(
					"relative text-black shadow-2xl overflow-hidden",
					"print:shadow-none print:m-0 print:w-[148mm] print:h-[210mm]",
				)}
				style={{
					width: "559px",
					height: "794px",
					transform: `scale(${scale})`,
					transformOrigin: "top center",
					marginBottom: `calc(794px * (${scale} - 1))`,
					WebkitPrintColorAdjust: "exact",
				}}
			>
				{/* Background */}
				<img
					src={settings?.backgroundUrl || "/images/bg-1.png"}
					alt=""
					className="absolute inset-0 w-full h-full object-cover -z-10"
					aria-hidden="true"
				/>

				<div className="relative z-10 p-5 flex flex-col h-full gap-2">
					{/* ── Header ── */}
					<div className="flex justify-between items-center">
						<img src="/images/logo.png" alt="logo" className="h-11" />
						<div className="text-right">
							<p className="text-[8px] font-semibold uppercase tracking-wide text-black">
								Wedding Photography
							</p>
							<p className="text-[8px] font-extrabold uppercase tracking-tight text-black">
								Dịch vụ cưới
							</p>
						</div>
					</div>

					{/* ── Title ── */}
					<div className="flex justify-center">
						<div className="relative">
							<h2 className="text-lg font-bold uppercase text-black px-2 tracking-widest">
								Hợp Đồng Dịch Vụ Cưới
							</h2>
							<div className="absolute -bottom-0.5 left-0 w-full h-[1.5px] bg-black/70" />
						</div>
					</div>

					{/* ── Combined Info Card: Studio + Thanh toán + Khách hàng ── */}
					<div className="bg-white/40 rounded-xl border border-white/50 backdrop-blur-sm p-2.5 space-y-2">
						{/* Row 1: Studio info + Bank accounts */}
						<div className="grid grid-cols-[1.3fr_1fr] gap-3 pb-2">
							{/* Studio */}
							<div className="space-y-1">
								<p className="text-[8.5px] font-black uppercase tracking-widest text-black flex items-center gap-1">
									<span className="w-2.5 h-[1.5px] bg-black inline-block" />
									Thông tin Studio
								</p>
								<div className="space-y-0.5 text-[8.5px] text-black font-medium leading-snug">
									<div className="flex items-start gap-1.5">
										<MapPin className="w-2.5 h-2.5 shrink-0 mt-px" />
										<span>{settings?.address || "..."}</span>
									</div>
									<div className="flex items-center gap-1.5">
										<Mail className="w-2.5 h-2.5 shrink-0" />
										<span>{settings?.email || "..."}</span>
									</div>
									<div className="flex items-center gap-1.5">
										<Phone className="w-2.5 h-2.5 shrink-0" />
										<span className="font-bold">
											{settings?.phone || "..."}
										</span>
									</div>
								</div>
							</div>

							{/* Bank accounts */}
							<div className="pl-3 space-y-1">
								<p className="text-[8.5px] font-black uppercase tracking-widest text-black flex items-center gap-1">
									<Landmark className="w-2.5 h-2.5" />
									Thanh toán
								</p>
								<div className="space-y-1">
									{(settings?.bankAccounts || [])
										.slice(0, 2)
										.map((acc, idx) => (
											<div
												key={idx}
												className="bg-white/40 border border-white/20 rounded px-1.5 py-0.5 flex justify-between items-center"
											>
												<div>
													<p className="text-[6.5px] font-black uppercase text-black">
														{acc.bank}
													</p>
													<p className="text-[7.5px] font-bold font-mono text-black leading-none">
														{acc.account}
													</p>
												</div>
												<p className="text-[6.5px] font-semibold uppercase text-black/70 text-right">
													{acc.owner}
												</p>
											</div>
										))}
								</div>
							</div>
						</div>

						{/* Row 2: Customer info */}
						<div className="space-y-1.5">
							<p className="text-[8.5px] font-black uppercase tracking-widest text-black flex items-center gap-1">
								<User className="w-2.5 h-2.5" />
								Thông tin khách hàng
							</p>

							<div className="grid grid-cols-[2fr_1fr] gap-x-4 gap-y-1 text-[8.5px] text-black">
								<div className="flex items-baseline gap-1.5 border-b border-black/10 pb-0.5">
									<span className="font-bold shrink-0 text-[8.5px]">
										Khách hàng:
									</span>
									<span className="font-semibold whitespace-nowrap">
										{data.customerName ||
											"............................................................................"}
									</span>
								</div>
								<div className="flex items-baseline gap-1.5 border-b border-black/10 pb-0.5">
									<span className="font-bold shrink-0 text-[8.5px]">SĐT:</span>
									<span className="font-bold">
										{data.phone || "....................................."}
									</span>
								</div>
								{/* Address – full width */}
								<div className="flex items-baseline gap-1.5 text-[8.5px] text-black border-b border-black/10 pb-0.5">
									<span className="font-bold shrink-0 text-[8.5px]">
										Địa chỉ:
									</span>
									<span className="font-semibold">
										{data.address ||
											"...................................................................................."}
									</span>
								</div>

								<div className="flex items-baseline gap-1.5 border-b border-black/10 pb-0.5">
									<span className="font-bold shrink-0 text-[8.5px]">
										Ngày cưới:
									</span>
									<span className="font-bold">
										{data.weddingDate
											? formatDate(data.weddingDate)
											: "............................"}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* ── Services / Combos ── */}
					<div className="bg-white/40 rounded-xl border border-white/50 backdrop-blur-sm p-2.5 overflow-hidden">
						{/* Table header */}
						<div className="flex justify-between text-[8.5px] font-black uppercase tracking-wide text-black border-b-2 border-black/20 pb-1 mb-1.5">
							<span>Nội dung combo / dịch vụ</span>
							<span>Thành tiền</span>
						</div>

						<div className="space-y-1.5 overflow-hidden">
							{(data.combos || []).map((combo, cIdx) => (
								<div key={cIdx}>
									<div className="flex justify-between items-baseline">
										<span className="text-[8.5px] font-extrabold uppercase text-black">
											{combo.comboName}
										</span>
										<span className="text-[8.5px] font-extrabold text-black">
											{formatCurrency(calculateComboTotal(combo))}
										</span>
									</div>
									<div className="pl-3 mt-0.5 space-y-0.5">
										{combo.services.map((s, sIdx) => (
											<div
												key={sIdx}
												className={cn(
													"flex justify-between text-[7.5px] text-black",
													s.isRemoved && "line-through opacity-40",
												)}
											>
												<span className="font-medium italic">
													{s.isRemoved ? "✗" : "•"} {s.name}
													{s.note && ` (${s.note})`}
												</span>
											</div>
										))}
									</div>
								</div>
							))}

							{(data.mediaServices || []).length > 0 && (
								<div className="space-y-1 pt-1 border-t border-black/10">
									{(data.mediaServices || []).map((svc, idx) => (
										<div
											key={idx}
											className="flex justify-between items-baseline text-[8.5px] text-black"
										>
											<span className="font-semibold italic">
												• {svc.name}{" "}
												{Number(svc.quantity) > 1 ? `x${svc.quantity}` : ""}
											</span>
											<span className="font-bold">
												{formatCurrency(calculateServiceTotal(svc))}
											</span>
										</div>
									))}
								</div>
							)}

							{(data.extraServices || []).length > 0 && (
								<div className="space-y-1 pt-1 border-t border-black/10">
									{(data.extraServices || []).map((svc, idx) => (
										<div
											key={idx}
											className="flex justify-between items-baseline text-[8.5px] text-black"
										>
											<span className="font-semibold italic">
												• {svc.name}{" "}
												{Number(svc.quantity) > 1 ? `x${svc.quantity}` : ""}
											</span>
											<span className="font-bold">
												{formatCurrency(calculateServiceTotal(svc))}
											</span>
										</div>
									))}
								</div>
							)}

							{Number(data.travelFee) > 0 && (
								<div className="flex justify-between text-[8.5px] text-black border-t border-black/10 pt-1 mt-1">
									<span className="font-semibold italic">
										• Phụ thu phí đi xa
									</span>
									<span className="font-bold">
										{formatCurrency(Number(data.travelFee))}
									</span>
								</div>
							)}

							{Number(data.incurredCost) > 0 && (
								<div className="flex justify-between text-[8.5px] text-black border-t border-black/10 pt-1 mt-1">
									<span className="font-semibold italic">
										• Chi phí phát sinh{" "}
										{data.incurredCostReason
											? `(${data.incurredCostReason})`
											: ""}
									</span>
									<span className="font-bold">
										{formatCurrency(Number(data.incurredCost))}
									</span>
								</div>
							)}
						</div>
					</div>

					{/* ── Notes ── */}
					{data.notes && (
						<div className="bg-white/40 rounded-xl border border-white/50 backdrop-blur-sm p-2 space-y-1">
							<p className="text-[8.5px] font-black uppercase tracking-widest text-black flex items-center gap-1">
								<MessageSquare className="w-2.5 h-2.5" />
								Ghi chú
							</p>
							<p className="text-[8.5px] text-black font-medium leading-relaxed whitespace-pre-wrap">
								{data.notes}
							</p>
						</div>
					)}

					{/* ── Payment Summary + Signature ── */}
					<div className="grid grid-cols-7 gap-3">
						{/* Payment summary */}
						<div className="col-span-3 bg-white/40 rounded-xl border border-white/50 backdrop-blur-sm p-2 space-y-1">
							<div className="flex justify-between text-[8.5px] text-black">
								<span className="font-semibold">Tạm tính</span>
								<span className="font-bold">
									{formatCurrency(subtotalBeforeDiscount)}
								</span>
							</div>
							{Number(data.discount) > 0 && (
								<div className="flex justify-between text-[8.5px] text-black">
									<span className="font-semibold">Giảm giá</span>
									<span className="font-bold">
										- {formatCurrency(Number(data.discount))}
									</span>
								</div>
							)}
							{data.includeVAT && (
								<div className="flex justify-between text-[8.5px] text-black">
									<span className="font-semibold">Thuế VAT (10%)</span>
									<span className="font-bold">{formatCurrency(vatAmount)}</span>
								</div>
							)}
							<div className="flex justify-between text-[8.5px] text-black font-extrabold">
								<span>Tổng chi phí</span>
								<span>{formatCurrency(totalPrice)}</span>
							</div>
							<div className="flex justify-between text-[8.5px] text-black">
								<span className="font-semibold">Đặt cọc</span>
								<span className="font-bold">
									{formatCurrency(Number(data.deposit))}
								</span>
							</div>
							<div className="flex justify-between text-[8.5px] text-black font-black border-t border-black/20 pt-1">
								<span>Còn lại</span>
								<span className="text-xs">{formatCurrency(remaining)}</span>
							</div>
							<div className="flex justify-between text-[8.5px] text-black">
								<span className="font-semibold">Ngày hẹn:</span>
								<span className="font-bold">
									{data.pickupDate ? formatDate(data.pickupDate) : "../../...."}
								</span>
							</div>
						</div>

						{/* Signature */}
						<div className="col-span-4 flex flex-col">
							<p className="text-right text-[8px] font-bold uppercase text-black mb-1">
								Ngày {day} tháng {month} năm {year}
							</p>
							<div className="grid grid-cols-2 text-[8px] font-black text-center text-black border-b border-black/20 pb-0.5">
								<span>KHÁCH HÀNG</span>
								<span>BIÊN NHẬN</span>
							</div>
							<div className="grid grid-cols-2 flex-1 min-h-[56px]">
								<div className="" />
								<div className="flex flex-col items-center justify-center relative">
									<div className="transform -rotate-6 absolute w-32 h-28 flex items-center justify-center">
										{settings?.signatureUrl && (
											<img
												src={settings.signatureUrl}
												alt="Signature"
												className="max-w-full max-h-full object-contain"
												onError={(e) =>
													(e.currentTarget.style.display = "none")
												}
											/>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* ── Footer notes ── */}
					<div className="text-[7.5px] leading-snug text-black pt-1.5 mt-auto">
						<p className="text-red-600 font-bold uppercase text-[8px] mb-0.5">
							* Lưu ý:
						</p>
						<ul className="space-y-0.5 uppercase tracking-tight font-medium">
							<li>
								• Đồ thuê hư hỏng khách hàng phải đền bù (SIGNATURE: 8tr, RUBY:
								6tr, DIAMOND: 4tr)
							</li>
							<li>• Thay đổi ngày đột xuất chúng tôi không chịu trách nhiệm</li>
							<li>• Quý khách sẽ mất chi phí cọc nếu hủy hợp đồng</li>
						</ul>
						<p className="text-black font-bold text-[10px] text-center mt-1 normal-case">
							Chân thành cảm ơn quý khách!
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
