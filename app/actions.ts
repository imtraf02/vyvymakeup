"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

export async function updateSettings(data: any) {
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

import type { WeddingContractSchema } from "@/lib/schema";

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

	// 1. Insert contract
	const { data: contract, error: contractError } = await supabase
		.from("wedding_contracts")
		.insert({
			customer_name: data.customerName,
			phone: data.phone,
			address: data.address,
			wedding_date: data.weddingDate.toISOString(),
			travel_fee: data.travelFee,
			discount: data.discount,
			incurred_cost: data.incurredCost,
			incurred_cost_reason: data.incurredCostReason,
			include_vat: data.includeVAT,
			deposit: data.deposit,
			pickup_date: data.pickupDate.toISOString(),
			contract_date: data.contractDate.toISOString(),
			notes: data.notes,
		})
		.select()
		.single();

	if (contractError) {
		console.error("Error saving wedding contract:", contractError);
		return { error: contractError.message };
	}

	// 2. Insert combos and services
	for (const combo of data.combos) {
		const { data: insertedCombo, error: comboError } = await supabase
			.from("wedding_contract_combos")
			.insert({
				contract_id: contract.id,
				combo_id: combo.id || null,
				combo_name: combo.comboName,
				base_price: combo.basePrice,
			})
			.select()
			.single();

		if (comboError) {
			console.error("Error saving wedding contract combo:", comboError);
			continue;
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
		}
	}

	// 3. Insert media services
	if (data.mediaServices && data.mediaServices.length > 0) {
		const mediaServices = data.mediaServices.map((s) => ({
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
			console.error("Error saving wedding contract media services:", mediaServicesError);
		}
	}

	// 4. Insert extra services
	if (data.extraServices && data.extraServices.length > 0) {
		const extraServices = data.extraServices.map((s) => ({
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
			console.error("Error saving wedding contract extra services:", extraServicesError);
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
