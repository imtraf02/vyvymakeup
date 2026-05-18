"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { captureElement } from "@/lib/capture";
import { CalendarIcon, Plus, Printer, Trash2, Download, ChevronDown, CheckCircle2, Circle, Eye, X } from "lucide-react";
import * as React from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { getWeddingCombos, getSettings, saveWeddingContract, getWeddingExtraServices } from "@/app/actions";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerClose,
} from "@/components/ui/drawer";
import { type WeddingContractSchema, weddingContractSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { WeddingContractPreview } from "./wedding-contract-preview";

interface WeddingContractFormProps {
	onDataChange: (data: WeddingContractSchema) => void;
	initialData?: Partial<WeddingContractSchema>;
}

// ─── Micro components ────────────────────────────────────────────────────────

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
	return (
		<div className="flex items-center justify-between px-2 py-2.5 bg-gradient-to-r from-theme-bg-muted to-white border-b border-theme-border">
			<span className="text-[10px] uppercase tracking-[0.22em] font-bold text-theme-text-muted">
				{title}
			</span>
			{action}
		</div>
	);
}

function Section({
	title,
	children,
	action,
}: {
	title: string;
	children: React.ReactNode;
	action?: React.ReactNode;
}) {
	return (
		<div className="rounded-2xl border border-theme-border bg-white shadow-[0_2px_12px_0_rgba(180,150,80,0.08)] overflow-hidden">
			<SectionHeader title={title} action={action} />
			<div className="p-2 space-y-3">{children}</div>
		</div>
	);
}

function Label({ children }: { children: React.ReactNode }) {
	return (
		<label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-theme-text-muted mb-1.5">
			{children}
		</label>
	);
}

// Touch-friendly input — min-height 48px for mobile
const inputCls =
	"w-full h-12 rounded-xl border border-theme-border-muted bg-theme-bg-body px-2 text-sm text-theme-text-dark placeholder:text-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-gold-primary/40 focus:border-theme-gold-primary transition-all duration-200";

// Date picker button — same 48px height
function DateButton({
	value,
	placeholder,
	onClick,
}: {
	value?: Date;
	placeholder: string;
	onClick?: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"w-full h-12 flex items-center gap-3 px-2 rounded-xl border border-theme-border-muted bg-theme-bg-body text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-theme-gold-primary/40",
				value ? "text-theme-text-dark" : "text-theme-text-muted",
			)}
		>
			<CalendarIcon className="w-4 h-4 text-theme-gold-primary shrink-0" />
			{value ? format(value, "dd/MM/yyyy") : placeholder}
		</button>
	);
}

// Quick-pick deposit chips
const DEPOSIT_AMOUNTS = [
	1_000_000, 2_000_000, 3_000_000, 4_000_000,
	5_000_000, 6_000_000, 7_000_000, 8_000_000, 9_000_000,
];

const formatVND = (n: number) =>
	new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const formatShort = (n: number) =>
	n >= 1_000_000 ? `${n / 1_000_000}tr` : new Intl.NumberFormat("vi-VN").format(n);

// ─── Main component ───────────────────────────────────────────────────────────

export function WeddingContractForm({ onDataChange, initialData }: WeddingContractFormProps) {
	const [masterCombos, setMasterCombos] = React.useState<any[]>([]);
	const [masterExtraServices, setMasterExtraServices] = React.useState<any[]>([]);
	const [settings, setSettings] = React.useState<any>(null);
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [isDownloading, setIsDownloading] = React.useState(false);
	const [isDownloadDialogOpen, setIsDownloadDialogOpen] = React.useState(false);
	const [isComboDialogOpen, setIsComboDialogOpen] = React.useState(false);
	const [isExtraDialogOpen, setIsExtraDialogOpen] = React.useState(false);
	const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);
	const [saveToDbOnDownload, setSaveToDbOnDownload] = React.useState(true);
	const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
	const isMobile = useIsMobile();

	const form = useForm<WeddingContractSchema>({
		resolver: zodResolver(weddingContractSchema),
		defaultValues: {
			combos: [],
			travelFee: 0,
			discount: 0,
			incurredCost: 0,
			incurredCostReason: "",
			deposit: 0,
			includeVAT: false,
			mediaServices: [],
			extraServices: [],
			contractDate: new Date(),
		},
	});

	const { register, control, watch, setValue, formState: { errors } } = form;

	const { fields: comboFields, append: appendCombo, remove: removeCombo } = useFieldArray({
		control,
		name: "combos",
		keyName: "fieldId",
	});
	const { fields: mediaFields, append: appendMedia, remove: removeMedia } = useFieldArray({
		control,
		name: "mediaServices",
	});
	const { fields: extraFields, append: appendExtra, remove: removeExtra } = useFieldArray({
		control,
		name: "extraServices",
	});

	React.useEffect(() => {
		if (initialData) form.reset({
			...initialData,
			mediaServices: initialData.mediaServices || [],
			extraServices: initialData.extraServices || [],
		});
	}, [initialData, form]);

	const values = watch();

	React.useEffect(() => {
		getWeddingCombos().then(setMasterCombos);
		getWeddingExtraServices().then(setMasterExtraServices);
		getSettings().then(setSettings);
	}, []);

	React.useEffect(() => {
		const sub = watch((v) => onDataChange(v as WeddingContractSchema));
		return () => sub.unsubscribe();
	}, [watch, onDataChange]);

	const addComboFromTemplate = (template: any) => {
		appendCombo({
			id: template.id,
			comboName: template.name,
			basePrice: template.base_price || 0,
			services: template.wedding_combo_services.map((s: any) => ({
				name: s.name,
				isRemoved: false,
				note: "",
			})),
		});
	};

	const onDownloadImage = async () => {
		try {
			setIsDownloading(true);
			const safeName = (form.getValues().customerName || "khach-hang")
				.replace(/[^a-z0-9]/gi, "-")
				.toLowerCase();
			await captureElement("wedding-preview-content", `${format(new Date(), "dd-MM-yyyy")}-${safeName}`);
			toast.success("Đã tạo file ảnh thành công!");
		} catch (err) {
			toast.error("Không thể tạo file ảnh.");
		} finally {
			setIsDownloading(false);
		}
	};

	const onConfirmDownload = async () => {
		setIsDownloadDialogOpen(false);
		if (!saveToDbOnDownload) {
			await onDownloadImage();
			return;
		}

		await form.handleSubmit(async (data) => {
			setIsSubmitting(true);
			try {
				const result = await saveWeddingContract(data);
				if (!result.success) { toast.error("Lưu thất bại: " + result.error); return; }
				toast.success("Hợp đồng đã được lưu!");
				await onDownloadImage();
			} catch { toast.error("Lỗi khi lưu!"); }
			finally { setIsSubmitting(false); }
		}, () => {
			toast.error("Vui lòng điền đầy đủ thông tin hợp lệ trước khi lưu");
		})();
	};

	const onSubmit = async (data: WeddingContractSchema) => {
		setIsSubmitting(true);
		try {
			const result = await saveWeddingContract(data);
			if (result.success) {
				toast.success("Hợp đồng cưới đã được lưu!");
				setTimeout(() => window.print(), 500);
			} else {
				toast.error("Lỗi: " + result.error);
			}
		} catch { toast.error("Có lỗi xảy ra!"); }
		finally { setIsSubmitting(false); }
	};

	// Totals
	const comboTotal = (values.combos || []).reduce((a, c) => a + (Number(c.basePrice) || 0), 0);
	const mediaTotal = (values.mediaServices || []).reduce((a, c) => a + (Number(c.price) * (Number(c.quantity) || 1) || 0), 0);
	const extraTotal = (values.extraServices || []).reduce((a, c) => a + (Number(c.price) * (Number(c.quantity) || 1) || 0), 0);
	const subtotal = comboTotal + mediaTotal + extraTotal + (Number(values.travelFee) || 0) + (Number(values.incurredCost) || 0) - (Number(values.discount) || 0);
	const vatAmount = values.includeVAT ? subtotal * 0.1 : 0;
	const totalPrice = subtotal + vatAmount;
	const remaining = totalPrice - (Number(values.deposit) || 0);

	return (
		<>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="space-y-3 pb-28 max-w-lg mx-auto px-2"
			>
				{/* ── Studio header ─────────────────────────────────────── */}
				<div className="rounded-2xl overflow-hidden shadow-[0_4px_24px_0_rgba(180,150,80,0.13)] border border-theme-border-muted">
					<div className="h-1 w-full bg-gradient-to-r from-theme-gold-primary via-theme-gold-light to-theme-gold-primary" />
					<div className="bg-gradient-to-br from-theme-bg-body to-white px-2 py-5 text-center">
						<div className="flex items-center justify-center gap-2 mb-1">
							<div className="h-px flex-1 bg-gradient-to-r from-transparent to-theme-gold-primary/50" />
							<h1 className="text-xl font-bold tracking-[0.15em] text-theme-gold-hover">
								{settings?.studioName || "HARMONY MEDIA"}
							</h1>
							<div className="h-px flex-1 bg-gradient-to-l from-transparent to-theme-gold-primary/50" />
						</div>
						<p className="text-[10px] tracking-[0.2em] uppercase text-theme-text-muted mb-3">
							Wedding Photography & Services
						</p>
						<div className="text-xs text-theme-text-muted space-y-0.5 mb-3">
							<p>{settings?.address || "Hòa Bình, Đông Hoà, Trảng Bom, Đồng Nai."}</p>
							<p>
								{settings?.email || "Studiohieutrancanon@gmail.com"}
								<span className="mx-2 text-theme-gold-primary">·</span>
								{settings?.phone || "0388.660.678"}
							</p>
						</div>
						<div className="flex flex-wrap justify-center gap-2">
							{(settings?.bankAccounts || [
								{ bank: "Sacombank", account: "050096596674" },
								{ bank: "MBBank", account: "0388660678" },
							]).map((acc: any, i: number) => (
								<div key={i} className="flex items-center gap-1.5 bg-theme-bg-muted border border-theme-border-muted rounded-lg px-2 py-1.5 text-[11px]">
									<span className="font-bold text-theme-text-muted">{acc.bank}</span>
									<span className="text-theme-gold-primary">·</span>
									<span className="font-mono tracking-wide text-theme-text-dark">{acc.account}</span>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* ── Khách hàng ────────────────────────────────────────── */}
				<Section title="Thông tin khách hàng">
					<Field>
						<Label>Tên khách hàng</Label>
						<Input {...register("customerName")} placeholder="Nguyễn Văn A" className={inputCls} />
					</Field>
					<Field>
						<Label>Số điện thoại (Không bắt buộc)</Label>
						<Input {...register("phone")} placeholder="090..." className={inputCls} inputMode="tel" />
					</Field>
					<Field>
						<Label>Địa chỉ</Label>
						<Input {...register("address")} placeholder="Địa chỉ liên hệ..." className={inputCls} />
					</Field>
				</Section>

				{/* ── Đám cưới ──────────────────────────────────────────── */}
				<Section title="Thông tin đám cưới">
					<Field>
						<Label>Ngày cưới</Label>
						<Controller
							control={control}
							name="weddingDate"
							render={({ field }) => (
								<Popover>
									<PopoverTrigger render={<DateButton value={field.value} placeholder="Chọn ngày cưới" />} />
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={vi} />
									</PopoverContent>
								</Popover>
							)}
						/>
					</Field>
					<Field>
						<Label>Ghi chú</Label>
						<Textarea
							{...register("notes")}
							placeholder="Yêu cầu đặc biệt..."
							rows={3}
							className="w-full rounded-xl border border-theme-border-muted bg-theme-bg-body px-2 py-3 text-sm text-theme-text-dark placeholder:text-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-gold-primary/40 resize-none"
						/>
					</Field>
				</Section>

				{/* ── Combo ─────────────────────────────────────────────── */}
				<div className="rounded-2xl border border-theme-border bg-white shadow-[0_2px_12px_0_rgba(180,150,80,0.08)] overflow-hidden">
					<SectionHeader
						title="Combo dịch vụ"
						action={
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => setIsComboDialogOpen(true)}
									className="h-8 rounded-xl border border-theme-border-muted text-theme-text-muted bg-white px-2 text-[11px] font-semibold flex items-center gap-1.5 hover:bg-theme-bg-muted transition-colors"
								>
									<Plus className="w-3.5 h-3.5" />
									MẪU
								</button>
								<Button
									type="button"
									size="sm"
									variant="outline"
									className="h-8 rounded-xl border-theme-border-muted text-theme-text-muted text-[11px] font-semibold"
									onClick={() => appendCombo({ comboName: "Combo mới", basePrice: 0, services: [{ name: "", isRemoved: false }] })}
								>
									<Plus className="w-3.5 h-3.5 mr-1" /> Thủ công
								</Button>
							</div>
						}
					/>

					<div className="p-3 space-y-3">
						{comboFields.length === 0 && (
							<p className="text-center py-6 border-2 border-dashed border-theme-border rounded-2xl text-theme-text-muted text-xs italic">
								Chưa có combo nào. Có thể bỏ qua hoặc thêm combo nếu cần.
							</p>
						)}

						{comboFields.map((combo, ci) => (
							<div key={combo.fieldId} className="rounded-2xl border border-theme-border bg-theme-bg-body overflow-hidden">
								{/* Combo header row */}
								<div className="border-b border-theme-border p-2 space-y-2">
									<Input
										{...register(`combos.${ci}.comboName`)}
										className="text-sm"
									/>
									{/* Price inline */}
									<div className="flex items-center">
										<Input
											type="number"
											inputMode="numeric"
											{...register(`combos.${ci}.basePrice`, { valueAsNumber: true })}
										/>
										<button
											type="button"
											onClick={() => removeCombo(ci)}
											className="w-8 h-8 flex items-center justify-center rounded-xl text-red-400 active:bg-red-50"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>
								</div>

								{/* Services */}
								<div className="p-3 space-y-2">
									{values.combos?.[ci]?.services?.map((svc, si) => (
										<div
											key={si}
											className={cn(
												"flex items-center gap-3 p-2 rounded-xl transition-all",
												svc.isRemoved ? "opacity-40 bg-slate-100" : "bg-white border border-theme-border-muted",
											)}
										>
											<button
												type="button"
												onClick={() => setValue(`combos.${ci}.services.${si}.isRemoved`, !svc.isRemoved)}
												className="shrink-0"
											>
												{svc.isRemoved
													? <Circle className="w-4 h-4 text-theme-text-muted" />
													: <CheckCircle2 className="w-4 h-4 text-theme-gold-primary" />}
											</button>
											<Input
												{...register(`combos.${ci}.services.${si}.name`)}
												placeholder="Tên dịch vụ"
												className="h-8 text-xs bg-transparent border-none p-0 focus:ring-0 flex-1"
											/>
											<button
												type="button"
												onClick={() => {
													const cur = form.getValues(`combos.${ci}.services`);
													const updated = cur.filter((_, idx) => idx !== si);
													setValue(`combos.${ci}.services`, updated);
												}}
												className="w-6 h-6 flex items-center justify-center text-red-400 active:scale-95"
											>
												<Trash2 className="w-3.5 h-3.5" />
											</button>
										</div>
									))}
									<button
										type="button"
										onClick={() => {
											const cur = form.getValues(`combos.${ci}.services`);
											setValue(`combos.${ci}.services`, [...cur, { name: "", isRemoved: false }]);
										}}
										className="flex items-center gap-1 text-[10px] text-theme-text-muted font-semibold mt-1 px-1 active:text-theme-gold-hover"
									>
										<Plus className="w-3 h-3" /> Thêm dịch vụ
									</button>
								</div>

								{/* Combo subtotal */}
								<div className="flex justify-between items-center px-2 py-2 bg-gradient-to-r from-theme-bg-muted to-white border-t border-dashed border-theme-border">
									<span className="text-[10px] uppercase font-bold text-theme-text-muted">Tổng combo</span>
									<span className="font-bold text-sm text-theme-gold-primary">
										{formatVND(Number(values.combos?.[ci]?.basePrice) || 0)}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* ── Quay / Chụp ────────────────────────────────────────── */}
				<div className="rounded-2xl border border-theme-border bg-white shadow-[0_2px_12px_0_rgba(180,150,80,0.08)] overflow-hidden">
					<SectionHeader
						title="Quay / Chụp cưới"
						action={
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => setIsMediaDialogOpen(true)}
									className="h-8 rounded-xl border border-theme-border-muted text-theme-text-muted bg-white px-2 text-[11px] font-semibold flex items-center gap-1.5 hover:bg-theme-bg-muted transition-colors"
								>
									<Plus className="w-3.5 h-3.5" />
									DANH SÁCH
								</button>
								<Button
									type="button"
									size="sm"
									variant="outline"
									className="h-8 rounded-xl border border-theme-border-muted text-theme-text-muted text-[11px] font-semibold"
									onClick={() => appendMedia({ name: "Dịch vụ mới", price: 0, quantity: 1 })}
								>
									<Plus className="w-3.5 h-3.5 mr-1" /> Thủ công
								</Button>
							</div>
						}
					/>

					<div className="p-3 space-y-2">
						{mediaFields.length === 0 && (
							<p className="text-center py-4 border-2 border-dashed border-theme-border rounded-2xl text-theme-text-muted text-xs italic">
								Chưa có dịch vụ quay chụp nào.
							</p>
						)}

						{mediaFields.map((field, index) => (
							<div key={field.id} className="flex gap-2 items-start bg-theme-bg-body p-2 rounded-xl border border-theme-border-muted">
								<div className="flex-1 space-y-1.5">
									<Input
										{...register(`mediaServices.${index}.name`)}
										placeholder="Tên dịch vụ"
										className="h-9 text-sm"
									/>
									<div className="flex gap-2 items-center">
										<div className="flex-1">
											<Input
												type="number"
												inputMode="numeric"
												{...register(`mediaServices.${index}.price`, { valueAsNumber: true })}
												placeholder="Giá"
												className="h-9 text-sm"
											/>
										</div>
										<div className="w-16">
											<Input
												type="number"
												inputMode="numeric"
												{...register(`mediaServices.${index}.quantity`, { valueAsNumber: true })}
												placeholder="SL"
												className="h-9 text-sm text-center"
											/>
										</div>
									</div>
								</div>
								<button
									type="button"
									onClick={() => removeMedia(index)}
									className="mt-1 w-9 h-9 flex items-center justify-center rounded-xl text-red-400 active:bg-red-50"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						))}

						{mediaFields.length > 0 && (
							<div className="flex justify-between items-center px-2 py-2 bg-gradient-to-r from-theme-gold-primary/5 to-white border-t border-dashed border-theme-border mt-2">
								<span className="text-[10px] uppercase font-bold text-theme-text-muted">Tổng quay chụp</span>
								<span className="font-bold text-sm text-theme-gold-primary">
									{formatVND(mediaTotal)}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* ── Dịch vụ lẻ ────────────────────────────────────────── */}
				<div className="rounded-2xl border border-theme-border bg-white shadow-[0_2px_12px_0_rgba(180,150,80,0.08)] overflow-hidden">
					<SectionHeader
						title="Dịch vụ lẻ"
						action={
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => setIsExtraDialogOpen(true)}
									className="h-8 rounded-xl border border-theme-border-muted text-theme-text-muted bg-white px-2 text-[11px] font-semibold flex items-center gap-1.5 hover:bg-theme-bg-muted transition-colors"
								>
									<Plus className="w-3.5 h-3.5" />
									DANH SÁCH
								</button>
								<Button
									type="button"
									size="sm"
									variant="outline"
									className="h-8 rounded-xl border-theme-border-muted text-theme-text-muted text-[11px] font-semibold"
									onClick={() => appendExtra({ name: "Dịch vụ mới", price: 0, quantity: 1 })}
								>
									<Plus className="w-3.5 h-3.5 mr-1" /> Thủ công
								</Button>
							</div>
						}
					/>

					<div className="p-3 space-y-2">
						{extraFields.length === 0 && (
							<p className="text-center py-4 border-2 border-dashed border-theme-border rounded-2xl text-theme-text-muted text-xs italic">
								Chưa có dịch vụ lẻ nào.
							</p>
						)}

						{extraFields.map((field, index) => (
							<div key={field.id} className="flex gap-2 items-start bg-theme-bg-body p-2 rounded-xl border border-theme-border-muted">
								<div className="flex-1 space-y-1.5">
									<Input
										{...register(`extraServices.${index}.name`)}
										placeholder="Tên dịch vụ"
										className="h-9 text-sm"
									/>
									<div className="flex gap-2 items-center">
										<div className="flex-1">
											<Input
												type="number"
												inputMode="numeric"
												{...register(`extraServices.${index}.price`, { valueAsNumber: true })}
												placeholder="Giá"
												className="h-9 text-sm"
											/>
										</div>
										<div className="w-16">
											<Input
												type="number"
												inputMode="numeric"
												{...register(`extraServices.${index}.quantity`, { valueAsNumber: true })}
												placeholder="SL"
												className="h-9 text-sm text-center"
											/>
										</div>
									</div>
								</div>
								<button
									type="button"
									onClick={() => removeExtra(index)}
									className="mt-1 w-9 h-9 flex items-center justify-center rounded-xl text-red-400 active:bg-red-50"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						))}

						{extraFields.length > 0 && (
							<div className="flex justify-between items-center px-2 py-2 bg-gradient-to-r from-theme-bg-muted to-white border-t border-dashed border-theme-border mt-2">
								<span className="text-[10px] uppercase font-bold text-theme-text-muted">Tổng dịch vụ lẻ</span>
								<span className="font-bold text-sm text-theme-gold-primary">
									{formatVND(extraTotal)}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* ── Thanh toán ────────────────────────────────────────── */}
				<Section title="Thanh toán & Phí">
					{/* 2-col grid for small numeric fields */}
					<div className="grid grid-cols-2 gap-2">
						<Field>
							<Label>Phí di chuyển (₫)</Label>
							<Input type="number" inputMode="numeric" {...register("travelFee", { valueAsNumber: true })} className={inputCls} />
						</Field>
						<Field>
							<Label>Giảm giá (₫)</Label>
							<Input type="number" inputMode="numeric" {...register("discount", { valueAsNumber: true })} className={inputCls} />
						</Field>
					</div>
					<div className="grid grid-cols-2 gap-2">
						<Field>
							<Label>Chi phí phát sinh (₫)</Label>
							<Input type="number" inputMode="numeric" {...register("incurredCost", { valueAsNumber: true })} className={inputCls} />
						</Field>
						<Field>
							<Label>Lý do phát sinh</Label>
							<Input {...register("incurredCostReason")} placeholder="Lý do..." className={inputCls} />
						</Field>
					</div>

					{/* VAT toggle + total — prominent card */}
					<div className="flex items-center justify-between p-2 bg-theme-bg-muted border border-theme-border-muted rounded-2xl">
						<div>
							<span className="text-[10px] uppercase font-bold text-theme-text-muted block mb-0.5">Tổng cộng</span>
							<span className="text-2xl font-black text-theme-gold-primary">{formatVND(totalPrice)}</span>
						</div>
						<label className="flex items-center gap-2 cursor-pointer select-none">
							<input type="checkbox" {...register("includeVAT")} className="w-5 h-5 rounded accent-theme-gold-primary" />
							<span className="text-xs font-bold text-theme-gold-hover">VAT 10%</span>
						</label>
					</div>

					{/* Deposit */}
					<div>
						<Label>Đặt cọc (₫)</Label>
						<Input type="number" inputMode="numeric" {...register("deposit", { valueAsNumber: true })} className={inputCls} />
						{/* Scrollable chip row */}
						<div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
							{DEPOSIT_AMOUNTS.map((v) => (
								<button
									key={v}
									type="button"
									onClick={() => setValue("deposit", v)}
									className={cn(
										"shrink-0 text-[10px] border rounded-lg px-2.5 py-1.5 font-bold transition-colors whitespace-nowrap",
										Number(values.deposit) === v
											? "border-theme-gold-primary bg-theme-gold-primary/10 text-theme-gold-hover"
											: "border-theme-border-muted bg-theme-bg-muted text-theme-gold-hover",
									)}
								>
									{formatShort(v)}
								</button>
							))}
						</div>
					</div>

					{/* Remaining — big red card */}
					<div className="rounded-2xl bg-red-50 border border-red-100 p-2 flex items-center justify-between">
						<span className="text-[10px] uppercase tracking-[0.18em] font-bold text-red-400">Còn lại phải thu</span>
						<span className="text-2xl font-black text-red-500">{formatVND(remaining)}</span>
					</div>

					{/* Date pickers — stacked on mobile */}
					<div className="grid grid-cols-1 gap-2">
						<Field>
							<Label>Ngày hẹn thanh toán</Label>
							<Controller
								control={control}
								name="pickupDate"
								render={({ field }) => (
									<Popover>
										<PopoverTrigger render={<DateButton value={field.value} placeholder="Chọn ngày" />} />
										<PopoverContent className="w-auto p-0" align="start">
											<Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={vi} />
										</PopoverContent>
									</Popover>
								)}
							/>
						</Field>
						<Field>
							<Label>Ngày lập hợp đồng</Label>
							<Controller
								control={control}
								name="contractDate"
								render={({ field }) => (
									<Popover>
										<PopoverTrigger render={<DateButton value={field.value} placeholder="Chọn ngày" />} />
										<PopoverContent className="w-auto p-0" align="start">
											<Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={vi} />
										</PopoverContent>
									</Popover>
								)}
							/>
						</Field>
					</div>
				</Section>

				{/* ── Sticky action bar ─────────────────────────────────── */}
				<div className="fixed bottom-0 left-0 right-0 z-50 no-print safe-area-bottom">
					{/* Summary strip above buttons */}
					<div className="bg-white/95 backdrop-blur-md border-t border-theme-border-muted px-2 pt-2 pb-0 flex items-center justify-between">
						<div className="flex items-baseline gap-2">
							<span className="text-[9px] uppercase font-bold text-theme-text-muted">Tổng</span>
							<span className="text-base font-black text-theme-gold-primary">{formatVND(totalPrice)}</span>
						</div>
						<div className="flex items-baseline gap-2">
							<span className="text-[9px] uppercase font-bold text-theme-text-muted">Còn lại</span>
							<span className="text-base font-black text-red-500">{formatVND(remaining)}</span>
						</div>
					</div>

					{/* Action buttons */}
					<div className="bg-white/95 backdrop-blur-md px-2 pb-2 pt-2 flex gap-2 justify-center md:justify-end">
						{isMobile && (
							<button
								type="button"
								onClick={() => setIsPreviewOpen(true)}
								className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-2xl bg-theme-bg-muted border border-theme-border-muted text-theme-gold-hover hover:bg-theme-border-muted transition-all shadow-sm"
							>
								<Eye className="w-5 h-5" />
							</button>
						)}
						<button
							type="button"
							onClick={() => setIsDownloadDialogOpen(true)}
							disabled={isDownloading}
							className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl border border-theme-border-muted bg-white font-bold text-[11px] text-theme-gold-hover shadow-sm active:bg-theme-bg-muted disabled:opacity-60 transition-all"
						>
							<Download className="w-4 h-4" />
							{isDownloading ? "Đang tạo..." : "TẢI ẢNH"}
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="flex-[1.5] h-12 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-theme-gold-primary to-theme-gold-light font-bold text-[11px] text-white shadow-lg active:opacity-90 disabled:opacity-60 transition-all"
						>
							<Printer className="w-4 h-4" />
							{isSubmitting ? "Đang lưu..." : "LƯU & IN"}
						</button>
					</div>
				</div>
			</form>

			{/* Mobile Preview Drawer */}
			{isMobile && (
				<Drawer open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
					<DrawerContent className="h-[90vh] bg-theme-bg-body">
						<DrawerHeader className="border-b border-theme-border pb-2 shrink-0">
							<div className="flex items-center justify-between">
								<DrawerTitle className="text-sm font-bold text-theme-gold-hover uppercase tracking-widest">Xem trước</DrawerTitle>
								<DrawerClose asChild>
									<button className="w-8 h-8 flex items-center justify-center rounded-full bg-theme-bg-muted text-theme-text-muted">
										<X className="w-4 h-4" />
									</button>
								</DrawerClose>
							</div>
						</DrawerHeader>
						<div className="flex-1 overflow-auto p-2">
							<WeddingContractPreview data={values as WeddingContractSchema} settings={settings} />
						</div>
					</DrawerContent>
				</Drawer>
			)}

			{/* ── Download dialog ──────────────────────────────────────── */}
			<Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
				<DialogContent className="w-[calc(100vw-2rem)] max-w-sm">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-theme-text-dark">Tải ảnh hợp đồng</DialogTitle>
						<DialogDescription className="text-sm text-theme-text-muted mt-1">
							Bạn có muốn lưu hợp đồng vào hệ thống trước khi tải ảnh không?
						</DialogDescription>
					</DialogHeader>

					<label className="flex items-center gap-3 py-3 cursor-pointer">
						<input
							type="checkbox"
							className="w-5 h-5 accent-theme-gold-primary rounded border-theme-border"
							checked={saveToDbOnDownload}
							onChange={(e) => setSaveToDbOnDownload(e.target.checked)}
						/>
						<span className="text-sm font-semibold text-theme-text-dark">Lưu vào cơ sở dữ liệu</span>
					</label>

					<DialogFooter className="flex-row gap-2 mt-2">
						<button
							type="button"
							onClick={() => setIsDownloadDialogOpen(false)}
							className="flex-1 h-11 rounded-xl border border-theme-border-muted text-sm font-semibold text-theme-text-muted active:bg-theme-bg-muted"
						>
							Huỷ
						</button>
						<button
							type="button"
							onClick={onConfirmDownload}
							className="flex-1 h-11 rounded-xl bg-theme-gold-primary text-white font-bold text-sm active:opacity-90"
						>
							{saveToDbOnDownload ? "Lưu & Tải ảnh" : "Chỉ Tải ảnh"}
						</button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			{isMobile ? (
				<Drawer open={isComboDialogOpen} onOpenChange={setIsComboDialogOpen}>
					<DrawerContent className="h-[85vh] bg-theme-bg-body">
						<DrawerHeader className="pb-2 shrink-0 border-b border-theme-border">
							<div className="flex items-center justify-between">
								<DrawerTitle className="text-xs font-black tracking-[0.2em] uppercase text-theme-gold-hover">
									Mẫu Combo
								</DrawerTitle>
								<DrawerClose asChild>
									<button className="w-8 h-8 flex items-center justify-center rounded-full bg-theme-bg-muted text-theme-text-muted">
										<X className="w-4 h-4" />
									</button>
								</DrawerClose>
							</div>
						</DrawerHeader>
						<div className="flex-1 overflow-y-auto p-3 space-y-3 bg-theme-bg-body/30 overscroll-contain">
							{masterCombos.map((template) => (
								<button
									key={template.id}
									type="button"
									onClick={() => {
										addComboFromTemplate(template);
										setIsComboDialogOpen(false);
									}}
									className="w-full flex flex-col p-4 rounded-2xl bg-white border border-theme-border shadow-sm active:border-theme-gold-primary active:bg-theme-gold-primary/5 transition-all duration-200 text-left gap-3"
								>
									<div className="flex justify-between items-start gap-4">
										<h3 className="font-bold text-base leading-tight text-theme-text-dark break-words">
											{template.name}
										</h3>
										<span className="text-[15px] font-black text-theme-gold-primary shrink-0 whitespace-nowrap">
											{formatVND(template.base_price || 0)}
										</span>
									</div>

									{template.description && (
										<p className="text-[13px] leading-relaxed text-theme-text-muted font-medium break-words">
											{template.description}
										</p>
									)}
									<div className="flex items-center justify-between mt-1">
										<span className="text-[9px] uppercase tracking-widest font-bold text-theme-text-muted opacity-60">
											Chạm để chọn gói
										</span>
										<div className="h-8 w-8 rounded-full bg-theme-bg-muted flex items-center justify-center text-theme-text-muted">
											<Plus className="w-4 h-4" />
										</div>
									</div>
								</button>
							))}
						</div>
					</DrawerContent>
				</Drawer>
			) : (
				<Dialog open={isComboDialogOpen} onOpenChange={setIsComboDialogOpen}>
					<DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md h-[85vh] overflow-hidden border-none shadow-2xl flex flex-col !gap-0">
						<DialogHeader className="pb-2 shrink-0">
							<DialogTitle className="text-xs font-black tracking-[0.2em] uppercase text-theme-gold-hover text-center">
								Mẫu Combo
							</DialogTitle>
						</DialogHeader>
						<div className="flex-1 overflow-y-auto py-1 space-y-3 bg-theme-bg-body/30 min-h-0 overscroll-contain">
							{masterCombos.map((template) => (
								<button
									key={template.id}
									type="button"
									onClick={() => {
										addComboFromTemplate(template);
										setIsComboDialogOpen(false);
									}}
									className="w-full flex flex-col p-4 rounded-2xl bg-white border border-theme-border shadow-sm hover:border-theme-gold-primary hover:shadow-md hover:bg-theme-gold-primary/5 group transition-all duration-300 text-left gap-3"
								>
									<div className="flex justify-between items-start gap-4">
										<h3 className="font-bold text-base leading-tight text-theme-text-dark group-hover:text-theme-gold-hover transition-colors break-words">
											{template.name}
										</h3>
										<span className="text-[15px] font-black text-theme-gold-primary shrink-0 whitespace-nowrap">
											{formatVND(template.base_price || 0)}
										</span>
									</div>

									{template.description && (
										<p className="text-[13px] leading-relaxed text-theme-text-muted font-medium break-words">
											{template.description}
										</p>
									)}
									<div className="flex items-center justify-between mt-1">
										<span className="text-[9px] uppercase tracking-widest font-bold text-theme-text-muted opacity-60">
											Click để chọn gói
										</span>
										<div className="h-8 w-8 rounded-full bg-theme-bg-muted flex items-center justify-center group-hover:bg-theme-gold-primary group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-inner">
											<Plus className="w-4 h-4" />
										</div>
									</div>
								</button>
							))}
						</div>
						<div className="pt-2 shrink-0">
							<button
								type="button"
								onClick={() => setIsComboDialogOpen(false)}
								className="w-full h-9 rounded-2xl bg-theme-bg-muted text-sm font-bold text-theme-text-muted active:scale-95 transition-all"
							>
								ĐÓNG
							</button>
						</div>
					</DialogContent>
				</Dialog>
			)}

			{isMobile ? (
				<Drawer open={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen}>
					<DrawerContent className="h-[85vh] bg-theme-bg-body">
						<DrawerHeader className="pb-2 shrink-0 border-b border-theme-border">
							<div className="flex items-center justify-between">
								<DrawerTitle className="text-xs font-black tracking-[0.2em] uppercase text-theme-gold-hover">
									Danh sách Quay / Chụp
								</DrawerTitle>
								<DrawerClose asChild>
									<button className="w-8 h-8 flex items-center justify-center rounded-full bg-theme-bg-muted text-theme-text-muted">
										<X className="w-4 h-4" />
									</button>
								</DrawerClose>
							</div>
						</DrawerHeader>
						<div className="flex-1 overflow-y-auto p-3 space-y-4 bg-theme-bg-body/30 overscroll-contain">
							{Array.from(new Set(masterExtraServices.filter(s => s.category.toLowerCase().includes("chụp") || s.category.toLowerCase().includes("quay")).map(s => s.category))).map(category => (
								<div key={category} className="space-y-2">
									<h3 className="text-[10px] font-black tracking-[0.15em] uppercase text-theme-text-muted px-1">
										{category}
									</h3>
									<div className="grid gap-2">
										{masterExtraServices
											.filter(s => s.category === category)
											.map(service => (
												<button
													key={service.id}
													type="button"
													onClick={() => {
														appendMedia({
															name: service.name,
															price: service.price,
															quantity: 1
														});
														setIsMediaDialogOpen(false);
													}}
													className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-theme-border shadow-sm active:border-theme-gold-primary active:bg-theme-gold-primary/5 transition-all text-left"
												>
													<span className="font-bold text-sm text-theme-text-dark">
														{service.name}
													</span>
													<div className="flex items-center gap-3">
														<span className="text-xs font-bold text-theme-gold-primary">
															{formatVND(service.price)}
														</span>
														<div className="h-6 w-6 rounded-full bg-theme-bg-muted flex items-center justify-center text-theme-text-muted">
															<Plus className="w-3 h-3" />
														</div>
													</div>
												</button>
											))}
									</div>
								</div>
							))}
							{masterExtraServices.filter(s => s.category.toLowerCase().includes("chụp") || s.category.toLowerCase().includes("quay")).length === 0 && (
								<p className="text-center py-10 text-theme-text-muted text-xs italic">
									Chưa có dịch vụ mẫu nào thuộc danh mục Quay / Chụp.
								</p>
							)}
						</div>
					</DrawerContent>
				</Drawer>
			) : (
				<Dialog open={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen}>
					<DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md h-[85vh] overflow-hidden border-none shadow-2xl flex flex-col !gap-0">
						<DialogHeader className="pb-2 shrink-0">
							<DialogTitle className="text-xs font-black tracking-[0.2em] uppercase text-theme-gold-hover text-center">
								Danh sách Quay / Chụp
							</DialogTitle>
						</DialogHeader>
						<div className="flex-1 overflow-y-auto py-1 space-y-4 bg-theme-bg-body/30 min-h-0 overscroll-contain">
							{Array.from(new Set(masterExtraServices.filter(s => s.category.toLowerCase().includes("chụp") || s.category.toLowerCase().includes("quay")).map(s => s.category))).map(category => (
								<div key={category} className="space-y-2">
									<h3 className="text-[10px] font-black tracking-[0.15em] uppercase text-theme-text-muted px-1">
										{category}
									</h3>
									<div className="grid gap-2">
										{masterExtraServices
											.filter(s => s.category === category)
											.map(service => (
												<button
													key={service.id}
													type="button"
													onClick={() => {
														appendMedia({
															name: service.name,
															price: service.price,
															quantity: 1
														});
														setIsMediaDialogOpen(false);
													}}
													className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-theme-border shadow-sm hover:border-theme-gold-primary hover:bg-theme-gold-primary/5 group transition-all text-left"
												>
													<span className="font-bold text-sm text-theme-text-dark group-hover:text-theme-gold-hover transition-colors">
														{service.name}
													</span>
													<div className="flex items-center gap-3">
														<span className="text-xs font-bold text-theme-gold-primary">
															{formatVND(service.price)}
														</span>
														<div className="h-6 w-6 rounded-full bg-theme-bg-muted flex items-center justify-center group-hover:bg-theme-gold-primary group-hover:text-white transition-all">
															<Plus className="w-3 h-3" />
														</div>
													</div>
												</button>
											))}
									</div>
								</div>
							))}
							{masterExtraServices.filter(s => s.category.toLowerCase().includes("chụp") || s.category.toLowerCase().includes("quay")).length === 0 && (
								<p className="text-center py-10 text-theme-text-muted text-xs italic">
									Chưa có dịch vụ mẫu nào thuộc danh mục Quay / Chụp.
								</p>
							)}
						</div>
						<div className="pt-2 shrink-0">
							<button
								type="button"
								onClick={() => setIsMediaDialogOpen(false)}
								className="w-full h-9 rounded-2xl bg-theme-bg-muted text-sm font-bold text-theme-text-muted active:scale-95 transition-all"
							>
								ĐÓNG
							</button>
						</div>
					</DialogContent>
				</Dialog>
			)}

			{isMobile ? (
				<Drawer open={isExtraDialogOpen} onOpenChange={setIsExtraDialogOpen}>
					<DrawerContent className="h-[85vh] bg-theme-bg-body">
						<DrawerHeader className="pb-2 shrink-0 border-b border-theme-border">
							<div className="flex items-center justify-between">
								<DrawerTitle className="text-xs font-black tracking-[0.2em] uppercase text-theme-gold-hover">
									Danh sách dịch vụ lẻ
								</DrawerTitle>
								<DrawerClose asChild>
									<button className="w-8 h-8 flex items-center justify-center rounded-full bg-theme-bg-muted text-theme-text-muted">
										<X className="w-4 h-4" />
									</button>
								</DrawerClose>
							</div>
						</DrawerHeader>
						<div className="flex-1 overflow-y-auto p-3 space-y-4 bg-theme-bg-body/30 overscroll-contain">
							{Array.from(new Set(masterExtraServices.filter(s => !s.category.toLowerCase().includes("chụp") && !s.category.toLowerCase().includes("quay")).map(s => s.category))).map(category => (
								<div key={category} className="space-y-2">
									<h3 className="text-[10px] font-black tracking-[0.15em] uppercase text-theme-text-muted px-1">
										{category}
									</h3>
									<div className="grid gap-2">
										{masterExtraServices
											.filter(s => s.category === category)
											.map(service => (
												<button
													key={service.id}
													type="button"
													onClick={() => {
														appendExtra({
															name: service.name,
															price: service.price,
															quantity: 1
														});
														setIsExtraDialogOpen(false);
													}}
													className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-theme-border shadow-sm active:border-theme-gold-primary active:bg-theme-gold-primary/5 transition-all text-left"
												>
													<span className="font-bold text-sm text-theme-text-dark">
														{service.name}
													</span>
													<div className="flex items-center gap-3">
														<span className="text-xs font-bold text-theme-gold-primary">
															{formatVND(service.price)}
														</span>
														<div className="h-6 w-6 rounded-full bg-theme-bg-muted flex items-center justify-center text-theme-text-muted">
															<Plus className="w-3 h-3" />
														</div>
													</div>
												</button>
											))}
									</div>
								</div>
							))}
						</div>
					</DrawerContent>
				</Drawer>
			) : (
				<Dialog open={isExtraDialogOpen} onOpenChange={setIsExtraDialogOpen}>
					<DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md h-[85vh] overflow-hidden border-none shadow-2xl flex flex-col !gap-0">
						<DialogHeader className="pb-2 shrink-0">
							<DialogTitle className="text-xs font-black tracking-[0.2em] uppercase text-theme-gold-hover text-center">
								Danh sách dịch vụ lẻ
							</DialogTitle>
						</DialogHeader>
						<div className="flex-1 overflow-y-auto py-1 space-y-4 bg-theme-bg-body/30 min-h-0 overscroll-contain">
							{Array.from(new Set(masterExtraServices.filter(s => !s.category.toLowerCase().includes("chụp") && !s.category.toLowerCase().includes("quay")).map(s => s.category))).map(category => (
								<div key={category} className="space-y-2">
									<h3 className="text-[10px] font-black tracking-[0.15em] uppercase text-theme-text-muted px-1">
										{category}
									</h3>
									<div className="grid gap-2">
										{masterExtraServices
											.filter(s => s.category === category)
											.map(service => (
												<button
													key={service.id}
													type="button"
													onClick={() => {
														appendExtra({
															name: service.name,
															price: service.price,
															quantity: 1
														});
														setIsExtraDialogOpen(false);
													}}
													className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-theme-border shadow-sm hover:border-theme-gold-primary hover:bg-theme-gold-primary/5 group transition-all text-left"
												>
													<span className="font-bold text-sm text-theme-text-dark group-hover:text-theme-gold-hover transition-colors">
														{service.name}
													</span>
													<div className="flex items-center gap-3">
														<span className="text-xs font-bold text-theme-gold-primary">
															{formatVND(service.price)}
														</span>
														<div className="h-6 w-6 rounded-full bg-theme-bg-muted flex items-center justify-center group-hover:bg-theme-gold-primary group-hover:text-white transition-all">
															<Plus className="w-3 h-3" />
														</div>
													</div>
												</button>
											))}
									</div>
								</div>
							))}
						</div>
						<div className="pt-2 shrink-0">
							<button
								type="button"
								onClick={() => setIsExtraDialogOpen(false)}
								className="w-full h-9 rounded-2xl bg-theme-bg-muted text-sm font-bold text-theme-text-muted active:scale-95 transition-all"
							>
								ĐÓNG
							</button>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</>
	);
}
