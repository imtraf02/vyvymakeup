"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Save, Trash2, Edit2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { getWeddingCombos, addWeddingCombo, updateWeddingCombo, deleteWeddingCombo } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { z } from "zod";

const comboTemplateSchema = z.object({
	name: z.string().min(1, "Vui lòng nhập tên combo"),
	description: z.string().optional(),
	basePrice: z.number().min(0),
	services: z.array(z.object({
		name: z.string().min(1, "Tên dịch vụ không được để trống"),
		price: z.number().min(0).default(0),
	})),
});

type ComboTemplate = z.infer<typeof comboTemplateSchema>;

export default function WeddingCombosPage() {
	const [combos, setCombos] = React.useState<any[]>([]);
	const [editingCombo, setEditingCombo] = React.useState<any | null>(null);
	const [isLoading, setIsLoading] = React.useState(true);

	const loadCombos = async () => {
		setIsLoading(true);
		const data = await getWeddingCombos();
		setCombos(data);
		setIsLoading(false);
	};

	React.useEffect(() => {
		loadCombos();
	}, []);

	const form = useForm<ComboTemplate>({
		resolver: zodResolver(comboTemplateSchema),
		defaultValues: {
			name: "",
			description: "",
			basePrice: 0,
			services: [],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "services",
	});

	const onSubmit = async (data: ComboTemplate) => {
		let res;
		if (editingCombo.isNew) {
			res = await addWeddingCombo(data);
		} else {
			res = await updateWeddingCombo(editingCombo.id, data);
		}

		if (res.success) {
			toast.success("Đã lưu mẫu combo thành công!");
			setEditingCombo(null);
			form.reset();
			loadCombos();
		} else {
			toast.error("Lỗi: " + res.error);
		}
	};

	const handleDelete = async (id: string) => {
		if (confirm("Bạn có chắc chắn muốn xoá combo mẫu này?")) {
			const res = await deleteWeddingCombo(id);
			if (res.success) {
				toast.success("Đã xoá combo mẫu");
				loadCombos();
			} else {
				toast.error("Lỗi: " + res.error);
			}
		}
	};

	const formatCurrency = (amount: number) =>
		new Intl.NumberFormat("vi-VN").format(amount);

	return (
		<div
			className="min-h-screen pb-20"
			style={{
				background: "linear-gradient(160deg, #fdfaf3 0%, #f5f0e8 100%)",
			}}
		>
			<div
				className="sticky top-0 z-10"
				style={{
					background: "rgba(253, 250, 243, 0.92)",
					backdropFilter: "blur(12px)",
					borderBottom: "1px solid #e8dcc8",
				}}
			>
				<div className="flex items-center gap-3 p-2 max-w-2xl mx-auto">
					<Link href="/settings">
						<button className="w-9 h-9 rounded-xl flex items-center justify-center border border-[#e0cc9a] bg-[#faf6ea] hover:bg-theme-border-muted text-[#b49050] transition-colors -ml-1">
							<ArrowLeft className="w-4 h-4" />
						</button>
					</Link>
					<h1 className="text-lg font-bold text-[#5a3e1b]">Quản lý Combo Cưới</h1>
					<Button 
						onClick={() => {
							setEditingCombo({ isNew: true });
							form.reset({ name: "", description: "", basePrice: 0, services: [] });
						}}
						size="sm"
						className="ml-auto rounded-xl bg-theme-gold-primary text-white"
					>
						<Plus className="w-4 h-4 mr-1" /> Thêm mới
					</Button>
				</div>
			</div>

			<div className="p-2 max-w-2xl mx-auto space-y-6">
				{editingCombo ? (
					<div className="bg-white rounded-2xl border border-[#e8dcc8] p-2 shadow-[0_4px_20px_0_rgba(200,168,75,0.12)] overflow-hidden">
						<h2 className="text-lg font-bold text-[#5a3e1b] mb-6">
							{editingCombo.isNew ? "Thêm Combo Mẫu Mới" : "Chỉnh sửa Combo Mẫu"}
						</h2>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							<Field>
								<FieldLabel>Tên Combo</FieldLabel>
								<Input {...form.register("name")} placeholder="VD: Trọn gói Vàng" />
							</Field>
							<Field>
								<FieldLabel>Mô tả</FieldLabel>
								<Input {...form.register("description")} placeholder="Mô tả ngắn gọn..." />
							</Field>
							<Field>
								<FieldLabel>Giá tham khảo (₫)</FieldLabel>
								<Input type="number" {...form.register("basePrice", { valueAsNumber: true })} />
							</Field>

							<Separator />

							<div className="space-y-4">
								<div className="flex items-center justify-between p-2">
									<h3 className="text-sm font-bold text-[#9a8060] uppercase tracking-wider">Dịch vụ trong combo</h3>
									<Button 
										type="button" 
										variant="outline" 
										size="sm" 
										className="h-8 rounded-xl border-[#e0cc9a] text-[#b49050]"
										onClick={() => append({ name: "", price: 0 })}
									>
										<Plus className="w-3.5 h-3.5 mr-1" /> Thêm dịch vụ
									</Button>
								</div>

								{fields.map((field, index) => (
									<div key={field.id} className="p-3 rounded-2xl border border-theme-border-muted bg-theme-bg-body/50 space-y-3 relative group">
										<div className="flex flex-col md:flex-row gap-3">
											<div className="flex-1">
												<label className="text-[10px] font-bold text-[#9a8060] uppercase mb-1 block md:hidden">Tên dịch vụ</label>
												<Input 
													{...form.register(`services.${index}.name`)} 
													placeholder="Tên dịch vụ (VD: Trang điểm cô dâu)" 
													className="bg-white"
												/>
											</div>
											<div className="flex items-center">
												<Button 
													type="button" 
													variant="ghost" 
													size="sm" 
													className="h-10 w-10 text-red-500 hover:bg-red-50 shrink-0"
													onClick={() => remove(index)}
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>

							<div className="flex gap-3 pt-6">
								<Button type="button" variant="ghost" className="flex-1 rounded-xl" onClick={() => setEditingCombo(null)}>Huỷ</Button>
								<Button type="submit" className="flex-1 rounded-xl bg-theme-gold-primary hover:bg-theme-gold-secondary text-white">Lưu Combo</Button>
							</div>
						</form>
					</div>
				) : (
					<div className="space-y-4">
						{isLoading ? (
							Array.from({ length: 3 }).map((_, i) => (
								<div key={i} className="bg-white rounded-2xl border border-[#e8dcc8] p-5 shadow-[0_4px_16px_0_rgba(200,168,75,0.08)] animate-pulse">
									<div className="flex justify-between items-start mb-4">
										<div className="space-y-2 flex-1">
											<div className="h-5 bg-slate-200 rounded w-1/3"></div>
											<div className="h-3 bg-slate-100 rounded w-1/2"></div>
										</div>
										<div className="h-6 bg-slate-200 rounded w-24"></div>
									</div>
									<div className="space-y-2 my-3">
										<div className="h-3 bg-slate-100 rounded w-full"></div>
										<div className="h-3 bg-slate-100 rounded w-5/6"></div>
									</div>
								</div>
							))
						) : combos.map(combo => (
							<div key={combo.id} className="bg-white rounded-2xl border border-[#e8dcc8] p-2 shadow-[0_4px_16px_0_rgba(200,168,75,0.08)] group transition-all duration-200 hover:border-theme-gold-primary hover:shadow-[0_4px_20px_0_rgba(200,168,75,0.13)] relative overflow-hidden">
								<div className="absolute top-0 left-0 h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-theme-gold-primary via-[#e8d07a] to-theme-gold-primary transition-all duration-300" />
								<div className="flex justify-between items-start mb-2">
									<div>
										<h3 className="font-bold text-[#5a3e1b]">{combo.name}</h3>
										<p className="text-xs text-[#9a8060]">{combo.description}</p>
									</div>
									<p className="font-black text-theme-gold-primary">{formatCurrency(combo.base_price)}</p>
								</div>
								<div className="space-y-1.5 my-4 bg-[#fafafa]/50 p-3 rounded-xl border border-dashed border-slate-100">
									{combo.wedding_combo_services?.map((s: any) => (
										<div key={s.id} className="flex items-center text-xs text-slate-600 gap-2">
											<div className="w-1 h-1 rounded-full bg-theme-gold-primary" />
											{s.name}
										</div>
									))}
								</div>
								<div className="flex justify-end gap-2 pt-3 border-t border-dashed border-slate-100 transition-opacity">
									<Button 
										variant="ghost" 
										size="sm" 
										className="h-8 rounded-xl text-[#b49050]"
										onClick={() => {
											setEditingCombo(combo);
											form.reset({
												name: combo.name,
												description: combo.description || "",
												basePrice: Number(combo.base_price) || 0,
												services: combo.wedding_combo_services.map((s: any) => ({ name: s.name, price: 0 }))
											});
										}}
									>
										<Edit2 className="w-3.5 h-3.5 mr-1" /> Sửa
									</Button>
									<Button 
										variant="ghost" 
										size="sm" 
										className="h-8 rounded-xl text-red-500"
										onClick={() => handleDelete(combo.id)}
									>
										<Trash2 className="w-3.5 h-3.5 mr-1" /> Xoá
									</Button>
								</div>
							</div>
						))}
						{combos.length === 0 && !isLoading && (
							<div className="text-center py-20 text-slate-400">Chưa có combo mẫu nào.</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
