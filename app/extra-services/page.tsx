"use client";

import {
	ArrowLeft,
	Check,
	Edit2,
	Plus,
	Trash2,
	X,
	ListPlus,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import {
	addWeddingExtraService,
	deleteWeddingExtraService,
	getWeddingExtraServices,
	updateWeddingExtraService,
} from "@/app/actions";

export default function ExtraServicesPage() {
	const [services, setServices] = React.useState<any[]>([]);
	const [newName, setNewName] = React.useState("");
	const [newCategory, setNewCategory] = React.useState("");
	const [newPrice, setNewPrice] = React.useState<number>(0);
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const [editName, setEditName] = React.useState("");
	const [editCategory, setEditCategory] = React.useState("");
	const [editPrice, setEditPrice] = React.useState<number>(0);
	const [showAddForm, setShowAddForm] = React.useState(false);
	const [isLoading, setIsLoading] = React.useState(true);

	const loadServices = async () => {
		setIsLoading(true);
		try {
			const data = await getWeddingExtraServices();
			setServices(data);
		} finally {
			setIsLoading(false);
		}
	};

	React.useEffect(() => {
		loadServices();
	}, []);

	const handleAdd = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newName || !newCategory) return;
		const res = await addWeddingExtraService({
			name: newName,
			category: newCategory,
			price: newPrice,
		});
		if (res.success) {
			setNewName("");
			setNewCategory("");
			setNewPrice(0);
			setShowAddForm(false);
			loadServices();
		}
	};

	const handleUpdate = async (id: string) => {
		if (!editName || !editCategory) return;
		const res = await updateWeddingExtraService(id, {
			name: editName,
			category: editCategory,
			price: editPrice,
		});
		if (res.success) {
			setEditingId(null);
			loadServices();
		}
	};

	const handleDelete = async (id: string) => {
		if (confirm("Bạn có chắc chắn muốn xoá dịch vụ này?")) {
			const res = await deleteWeddingExtraService(id);
			if (res.success) loadServices();
		}
	};

	const startEdit = (svc: any) => {
		setEditingId(svc.id);
		setEditName(svc.name);
		setEditCategory(svc.category);
		setEditPrice(svc.price);
	};

	const formatCurrency = (amount: number) =>
		new Intl.NumberFormat("vi-VN", {
			style: "currency",
			currency: "VND",
		}).format(amount);

	const inputCls =
		"w-full h-10 rounded-xl border border-theme-border-muted bg-theme-bg-body px-3.5 text-sm text-[#2d2418] placeholder:text-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-gold-primary/40 focus:border-theme-gold-primary transition-all duration-200";

	// Group services by category for display
	const groupedServices = services.reduce((acc, svc) => {
		if (!acc[svc.category]) acc[svc.category] = [];
		acc[svc.category].push(svc);
		return acc;
	}, {} as Record<string, any[]>);

	const categories = Array.from(new Set(services.map(s => s.category)));
	// Get unique categories for autocomplete in Add form
	const existingCategories = categories;

	return (
		<div
			className="min-h-screen pb-20"
			style={{
				background: "linear-gradient(160deg, #fdfaf3 0%, #f5f0e8 100%)",
			}}
		>
			{/* ── Sticky Header ── */}
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

					<div className="flex items-center gap-2.5 ml-1">
						<div className="h-5 w-px bg-[#e0cc9a]" />
						<h1
							className="text-lg font-bold tracking-wide text-[#5a3e1b]"
						>
							Dịch vụ lẻ
						</h1>
					</div>

					<div className="ml-auto flex items-center gap-1.5 bg-gradient-to-r from-theme-gold-primary to-[#e8c84b] text-white rounded-full px-3 py-1 shadow-sm">
						<span className="text-xs font-bold">{services.length}</span>
						<span className="text-[10px] opacity-80">dịch vụ</span>
					</div>
				</div>
			</div>

			<div className="p-2 max-w-2xl mx-auto space-y-3">
				{/* ── Add form toggle ── */}
				{!showAddForm ? (
					<button
						onClick={() => setShowAddForm(true)}
						className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-[#e0cc9a] text-sm font-semibold text-[#b49050] hover:border-theme-gold-primary hover:text-theme-gold-hover hover:bg-[#faf6ea] transition-all duration-200 group"
					>
						<div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center group-hover:bg-theme-gold-primary group-hover:border-theme-gold-primary group-hover:text-white transition-all">
							<Plus className="w-3 h-3" />
						</div>
						Thêm dịch vụ mới
					</button>
				) : (
					<div className="rounded-2xl border border-[#e0cc9a] bg-white shadow-[0_4px_20px_0_rgba(200,168,75,0.12)] overflow-hidden">
						{/* Form header */}
						<div className="flex items-center justify-between p-2 bg-gradient-to-r from-[#faf6ef] to-white border-b border-[#e8dcc8]">
							<span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#b49050]">
								Dịch vụ mới
							</span>
							<button
								onClick={() => setShowAddForm(false)}
								className="w-6 h-6 rounded-lg flex items-center justify-center text-[#b49050] hover:bg-[#faf6ea] transition-colors"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						</div>

						<form onSubmit={handleAdd} className="p-2 space-y-4">
							<div>
								<label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9a8060] mb-1.5">
									Danh mục
								</label>
								<input
									value={newCategory}
									onChange={(e) => setNewCategory(e.target.value)}
									placeholder="VD: Dịch vụ ngày cưới, Xe hoa..."
									list="category-options"
									autoFocus
									className={inputCls}
								/>
								<datalist id="category-options">
									{existingCategories.map(cat => <option key={cat} value={cat} />)}
								</datalist>
							</div>
							<div>
								<label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9a8060] mb-1.5">
									Tên dịch vụ
								</label>
								<input
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
									placeholder="VD: Thuê áo dài bê quả"
									className={inputCls}
								/>
							</div>
							<div>
								<label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9a8060] mb-1.5">
									Giá tiền (₫)
								</label>
								<input
									type="number"
									value={newPrice}
									onChange={(e) => setNewPrice(Number(e.target.value))}
									placeholder="0"
									className={inputCls}
								/>
							</div>
							<button
								type="submit"
								disabled={!newName || !newCategory}
								className="w-full h-11 rounded-xl bg-gradient-to-r from-theme-gold-primary to-[#e8c84b] disabled:opacity-50 hover:from-[#b49040] hover:to-theme-gold-hover text-white text-sm font-bold tracking-wide flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
							>
								<Plus className="w-4 h-4" /> Thêm dịch vụ
							</button>
						</form>
					</div>
				)}

				{/* ── Services list by category ── */}
				{isLoading ? (
					Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="rounded-2xl border border-[#e8dcc8] bg-white overflow-hidden p-4 animate-pulse flex items-center">
							<div className="w-10 h-10 rounded-full bg-[#faf6ea]" />
							<div className="ml-3 flex-1 space-y-2">
								<div className="h-4 bg-[#faf6ea] rounded w-1/2" />
								<div className="h-3 bg-[#faf6ea] rounded w-1/3" />
							</div>
						</div>
					))
				) : services.length === 0 ? (
					<div className="text-center py-20">
						<div className="w-16 h-16 rounded-2xl bg-[#faf6ea] border border-[#e8dcc8] flex items-center justify-center mx-auto mb-4">
							<ListPlus className="w-7 h-7 text-theme-gold-primary opacity-50" />
						</div>
						<p className="font-semibold text-theme-text-muted text-sm">Chưa có dịch vụ lẻ nào</p>
						<p className="text-xs text-theme-text-muted mt-1">Nhấn nút bên trên để thêm mới</p>
					</div>
				) : (
					categories.map((cat, catIndex) => (
						<div key={catIndex} className="pt-2">
							<h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-theme-text-muted mb-2 px-1">
								{cat}
							</h2>
							<div className="space-y-2">
								{groupedServices[cat].map((svc: any, i: number) => (
									<div
										key={svc.id}
										className="rounded-2xl border border-[#e8dcc8] bg-white overflow-hidden group transition-all duration-200 hover:border-theme-gold-primary hover:shadow-[0_4px_16px_0_rgba(200,168,75,0.13)]"
									>
										<div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-theme-gold-primary via-[#e8d07a] to-theme-gold-primary transition-all duration-300" />

										{editingId === svc.id ? (
											/* ── Edit mode ── */
											<div className="p-2 space-y-4">
												<div>
													<label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9a8060] mb-1.5">
														Danh mục
													</label>
													<input
														value={editCategory}
														onChange={(e) => setEditCategory(e.target.value)}
														list="edit-category-options"
														className={inputCls}
													/>
													<datalist id="edit-category-options">
														{existingCategories.map(c => <option key={c} value={c} />)}
													</datalist>
												</div>
												<div>
													<label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9a8060] mb-1.5">
														Tên dịch vụ
													</label>
													<input
														value={editName}
														onChange={(e) => setEditName(e.target.value)}
														autoFocus
														className={inputCls}
													/>
												</div>
												<div>
													<label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9a8060] mb-1.5">
														Giá tiền (₫)
													</label>
													<input
														type="number"
														value={editPrice}
														onChange={(e) => setEditPrice(Number(e.target.value))}
														className={inputCls}
													/>
												</div>
												<div className="flex gap-2">
													<button
														onClick={() => handleUpdate(svc.id)}
														disabled={!editName || !editCategory}
														className="flex-1 h-10 rounded-xl bg-gradient-to-r from-[#4caf7a] to-[#5dc98a] disabled:opacity-50 hover:from-[#3a9f6a] hover:to-[#4db87a] text-white text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
													>
														<Check className="w-4 h-4" /> Lưu
													</button>
													<button
														onClick={() => setEditingId(null)}
														className="flex-1 h-10 rounded-xl border border-theme-border-muted bg-theme-bg-body text-theme-text-muted text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-[#faf6ea] hover:border-theme-gold-primary transition-all"
													>
														<X className="w-4 h-4" /> Huỷ
													</button>
												</div>
											</div>
										) : (
											/* ── View mode ── */
											<div className="flex items-center p-2">
												<div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#faf6ea] to-theme-border-muted border border-[#e0cc9a] flex items-center justify-center shrink-0 relative">
													<ListPlus className="w-4 h-4 text-theme-gold-primary" />
													<span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-theme-gold-primary to-[#e8d07a] text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
														{i + 1}
													</span>
												</div>

												<div className="ml-3 flex-1 min-w-0">
													<p className="font-semibold text-sm text-[#2d2418] truncate">
														{svc.name}
													</p>
													<p className="text-xs font-bold text-theme-gold-primary mt-0.5">
														{formatCurrency(svc.price)}
													</p>
												</div>

												<div className="flex items-center gap-0.5 ml-2 shrink-0">
													<button
														onClick={() => startEdit(svc)}
														className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9a8060] hover:text-[#5a3e1b] hover:bg-[#faf6ea] transition-colors"
														title="Chỉnh sửa"
													>
														<Edit2 className="w-3.5 h-3.5" />
													</button>
													<button
														onClick={() => handleDelete(svc.id)}
														className="w-8 h-8 rounded-lg flex items-center justify-center text-theme-text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
														title="Xoá"
													>
														<Trash2 className="w-3.5 h-3.5" />
													</button>
												</div>
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
