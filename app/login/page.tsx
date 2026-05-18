"use client";

import { Camera, Lock } from "lucide-react";
import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { login } from "./actions";

const initialState = {
	error: "",
};

export default function LoginPage() {
	const [state, formAction, isPending] = useActionState(login, initialState);

	return (
		<div className="min-h-screen bg-theme-bg-body flex flex-col justify-center items-center p-4">
			<div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-theme-border p-8 overflow-hidden relative">
				<div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-theme-gold-light via-theme-gold-primary to-theme-gold-light" />

				<div className="text-center mb-8">
					<div className="w-16 h-16 rounded-2xl bg-theme-bg-muted border border-theme-border flex items-center justify-center mx-auto mb-4 shadow-inner">
						<Camera className="w-8 h-8 text-theme-gold-primary" />
					</div>
					<h1 className="text-2xl font-black text-theme-text-dark tracking-tight">
						VyVy
					</h1>
					<p className="text-sm text-theme-text-muted mt-2 font-medium">
						Đăng nhập hệ thống nội bộ
					</p>
				</div>

				<form action={formAction} className="space-y-4">
					<div>
						<label className="block text-xs font-bold uppercase tracking-widest text-theme-text-muted mb-2">
							Email
						</label>
						<input
							name="email"
							type="email"
							required
							placeholder="admin@studio.com"
							className="w-full h-12 px-4 rounded-xl bg-theme-bg-body border border-theme-border focus:outline-none focus:ring-2 focus:ring-theme-gold-primary/40 focus:border-theme-gold-primary transition-all font-medium"
						/>
					</div>
					<div>
						<label className="block text-xs font-bold uppercase tracking-widest text-theme-text-muted mb-2">
							Mật khẩu
						</label>
						<input
							name="password"
							type="password"
							required
							placeholder="••••••••"
							className="w-full h-12 px-4 rounded-xl bg-theme-bg-body border border-theme-border focus:outline-none focus:ring-2 focus:ring-theme-gold-primary/40 focus:border-theme-gold-primary transition-all font-medium"
						/>
					</div>

					{state?.error && (
						<div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold flex items-center gap-2">
							<Lock className="w-4 h-4 shrink-0" />
							{state.error}
						</div>
					)}

					<Button
						type="submit"
						disabled={isPending}
						className="w-full h-12 rounded-xl bg-gradient-to-r from-theme-gold-primary to-theme-gold-light hover:from-theme-gold-hover hover:to-theme-gold-primary text-white font-bold shadow-lg shadow-theme-gold-primary/30 transition-all active:scale-[0.98] mt-4"
					>
						{isPending ? "Đang xử lý..." : "Đăng nhập"}
					</Button>
				</form>

				<div className="mt-8 pt-6 border-t border-theme-border text-center">
					<p className="text-[10px] text-theme-text-muted font-semibold uppercase tracking-widest">
						Bảo mật & Quản lý nội bộ
					</p>
				</div>
			</div>
		</div>
	);
}
