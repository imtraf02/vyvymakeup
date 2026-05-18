"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { weddingContractSchema, type SettingsSchema, type WeddingContractSchema } from "@/lib/schema";

export async function getSettings() {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("settings")
		.select("*")
		.match({ id: "main" })
		.single();

	if (error) {
		console.error("Error fetching settings:", error);
		return null;
	}

	return {
		studioName: data.studio_name,
		address: data.address,
		email: data.email,
		phone: data.phone,
		bankAccounts: data.bank_accounts,
		backgroundUrl: data.background_url,
		signatureUrl: data.signature_url,
	};
}

export async function updateSettings(data: SettingsSchema) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("settings")
		.update({
			studio_name: data.studioName,
			address: data.address,
			email: data.email,
			phone: data.phone,
			bank_accounts: data.bankAccounts,
			background_url: data.backgroundUrl,
			signature_url: data.signatureUrl,
			updated_at: new Date().toISOString(),
		})
		.match({ id: "main" });

	if (error) {
		console.error("Error updating settings:", error);
		return { error: error.message };
	}

	revalidatePath("/");
	return { success: true };
}

export async function getWeddingCombos() {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("wedding_combos")
		.select(`
			*,
			wedding_combo_services (*)
		`)
		.order("name");

	if (error) {
		console.error("Error fetching wedding combos:", error);
		return [];
	}

	return data;
}

export async function getWeddingExtraServices() {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("wedding_extra_services")
		.select("*")
		.order("sort_order");

	if (error) {
		console.error("Error fetching wedding extra services:", error);
		return [];
	}

	return data;
}

export async function saveWeddingContract(data: WeddingContractSchema) {
	const supabase = await createClient();
	const parsed = weddingContractSchema.safeParse(data);

	if (!parsed.success) {
		return { error: "Dữ liệu hợp đồng không hợp lệ" };
	}

	const contractData = parsed.data;
	const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

	// 1. Insert contract
	const { data: contract, error: contractError } = await supabase
		.from("wedding_contracts")
		.insert({
			customer_name: contractData.customerName,
			phone: contractData.phone,
			address: contractData.address,
			wedding_date: contractData.weddingDate.toISOString(),
			travel_fee: contractData.travelFee,
			discount: contractData.discount,
			incurred_cost: contractData.incurredCost,
			incurred_cost_reason: contractData.incurredCostReason,
			include_vat: contractData.includeVAT,
			deposit: contractData.deposit,
			pickup_date: contractData.pickupDate.toISOString(),
			contract_date: contractData.contractDate.toISOString(),
			notes: contractData.notes,
		})
		.select()
		.single();

	if (contractError) {
		console.error("Error saving wedding contract:", contractError);
		return { error: contractError.message };
	}

	const rollbackContract = async () => {
		await supabase.from("wedding_contracts").delete().match({ id: contract.id });
	};
	const isMissingCategoryColumn = (message?: string) =>
		message?.includes("'category' column") || message?.includes("category column");

	// 2. Insert combos and services
	for (const combo of contractData.combos) {
		const { data: insertedCombo, error: comboError } = await supabase
			.from("wedding_contract_combos")
			.insert({
				contract_id: contract.id,
				combo_id: combo.id && uuidPattern.test(combo.id) ? combo.id : null,
				combo_name: combo.comboName,
				base_price: combo.basePrice,
			})
			.select()
			.single();

		if (comboError) {
			console.error("Error saving wedding contract combo:", comboError);
			await rollbackContract();
			return { error: comboError.message };
		}

		const services = combo.services.map((s, idx) => ({
			contract_combo_id: insertedCombo.id,
			service_name: s.name,
			is_removed: s.isRemoved,
			note: s.note,
			sort_order: idx,
		}));

		const { error: servicesError } = await supabase
			.from("wedding_contract_combo_services")
			.insert(services);

		if (servicesError) {
			console.error("Error saving wedding contract combo services:", servicesError);
			await rollbackContract();
			return { error: servicesError.message };
		}
	}

	// 3. Insert media services
	if (contractData.mediaServices && contractData.mediaServices.length > 0) {
		const mediaServices = contractData.mediaServices.map((s) => ({
			contract_id: contract.id,
			category: "Media",
			name: s.name,
			price: s.price,
			quantity: s.quantity,
		}));

		const { error: mediaServicesError } = await supabase
			.from("wedding_contract_extra_services")
			.insert(mediaServices);

		if (mediaServicesError) {
			if (isMissingCategoryColumn(mediaServicesError.message)) {
				const mediaServicesWithoutCategory = mediaServices.map((service) => ({
					contract_id: service.contract_id,
					name: service.name,
					price: service.price,
					quantity: service.quantity,
				}));
				const { error: retryError } = await supabase
					.from("wedding_contract_extra_services")
					.insert(mediaServicesWithoutCategory);

				if (retryError) {
					console.error("Error saving wedding contract media services:", retryError);
					await rollbackContract();
					return { error: retryError.message };
				}
			} else {
				console.error("Error saving wedding contract media services:", mediaServicesError);
				await rollbackContract();
				return { error: mediaServicesError.message };
			}
		}
	}

	// 4. Insert extra services
	if (contractData.extraServices && contractData.extraServices.length > 0) {
		const extraServices = contractData.extraServices.map((s) => ({
			contract_id: contract.id,
			category: "Extra",
			name: s.name,
			price: s.price,
			quantity: s.quantity,
		}));

		const { error: extraServicesError } = await supabase
			.from("wedding_contract_extra_services")
			.insert(extraServices);

		if (extraServicesError) {
			if (isMissingCategoryColumn(extraServicesError.message)) {
				const extraServicesWithoutCategory = extraServices.map((service) => ({
					contract_id: service.contract_id,
					name: service.name,
					price: service.price,
					quantity: service.quantity,
				}));
				const { error: retryError } = await supabase
					.from("wedding_contract_extra_services")
					.insert(extraServicesWithoutCategory);

				if (retryError) {
					console.error("Error saving wedding contract extra services:", retryError);
					await rollbackContract();
					return { error: retryError.message };
				}
			} else {
				console.error("Error saving wedding contract extra services:", extraServicesError);
				await rollbackContract();
				return { error: extraServicesError.message };
			}
		}
	}

	revalidatePath("/");
	revalidatePath("/contracts");
	return { success: true, id: contract.id };
}

export async function getWeddingContracts() {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("wedding_contracts")
		.select(`
			*,
			wedding_contract_combos (
				*,
				wedding_contract_combo_services (*)
			),
			wedding_contract_extra_services (*)
		`)
		.order("created_at", { ascending: false });

	if (error) {
		console.error("Error fetching wedding contracts:", error);
		return [];
	}

	return data;
}

export async function getWeddingContractById(id: string) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("wedding_contracts")
		.select(`
			*,
			wedding_contract_combos (
				*,
				wedding_contract_combo_services (*)
			),
			wedding_contract_extra_services (*)
		`)
		.match({ id })
		.single();

	if (error) {
		console.error("Error fetching wedding contract:", error);
		return null;
	}

	return data;
}

export async function deleteWeddingContract(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.from("wedding_contracts").delete().match({ id });

	if (error) return { error: error.message };
	revalidatePath("/contracts");
	return { success: true };
}

export async function updateWeddingContractDeposit(id: string, deposit: number) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("wedding_contracts")
		.update({
			deposit: Math.max(0, deposit),
			updated_at: new Date().toISOString(),
		})
		.match({ id });

	if (error) return { error: error.message };
	revalidatePath("/contracts");
	return { success: true };
}

export async function addWeddingCombo(data: { name: string, description?: string, basePrice: number, services: { name: string }[] }) {
	const supabase = await createClient();
	const { data: combo, error: comboError } = await supabase
		.from("wedding_combos")
		.insert({
			name: data.name,
			description: data.description,
			base_price: data.basePrice,
		})
		.select()
		.single();

	if (comboError) return { error: comboError.message };

	const services = data.services.map((s, idx) => ({
		combo_id: combo.id,
		name: s.name,
		sort_order: idx,
	}));

	const { error: servicesError } = await supabase
		.from("wedding_combo_services")
		.insert(services);

	if (servicesError) return { error: servicesError.message };

	revalidatePath("/wedding-combos");
	return { success: true };
}

export async function updateWeddingCombo(id: string, data: { name: string, description?: string, basePrice: number, services: { name: string }[] }) {
	const supabase = await createClient();

	// Update combo info
	const { error: comboError } = await supabase
		.from("wedding_combos")
		.update({
			name: data.name,
			description: data.description,
			base_price: data.basePrice,
			updated_at: new Date().toISOString(),
		})
		.match({ id });

	if (comboError) return { error: comboError.message };

	// Simple way: delete old services and insert new ones
	await supabase.from("wedding_combo_services").delete().match({ combo_id: id });

	const services = data.services.map((s, idx) => ({
		combo_id: id,
		name: s.name,
		sort_order: idx,
	}));

	const { error: servicesError } = await supabase
		.from("wedding_combo_services")
		.insert(services);

	if (servicesError) return { error: servicesError.message };

	revalidatePath("/wedding-combos");
	return { success: true };
}

export async function deleteWeddingCombo(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.from("wedding_combos").delete().match({ id });

	if (error) return { error: error.message };
	revalidatePath("/wedding-combos");
	return { success: true };
}

export async function addWeddingExtraService(data: { name: string, category: string, price: number, sortOrder?: number }) {
	const supabase = await createClient();
	const { data: service, error } = await supabase
		.from("wedding_extra_services")
		.insert({
			name: data.name,
			category: data.category,
			price: data.price,
			sort_order: data.sortOrder || 0,
		})
		.select()
		.single();

	if (error) return { error: error.message };
	revalidatePath("/extra-services");
	return { success: true, data: service };
}

export async function updateWeddingExtraService(id: string, data: { name: string, category: string, price: number, sortOrder?: number }) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("wedding_extra_services")
		.update({
			name: data.name,
			category: data.category,
			price: data.price,
			sort_order: data.sortOrder || 0,
			updated_at: new Date().toISOString(),
		})
		.match({ id });

	if (error) return { error: error.message };
	revalidatePath("/extra-services");
	return { success: true };
}

export async function deleteWeddingExtraService(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.from("wedding_extra_services").delete().match({ id });

	if (error) return { error: error.message };
	revalidatePath("/extra-services");
	return { success: true };
}
