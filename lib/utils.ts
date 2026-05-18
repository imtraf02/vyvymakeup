import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import type { WeddingContractSchema } from "./schema"

export function mapToWeddingSchema(contract: any): Partial<WeddingContractSchema> {
	if (!contract) return {};
	return {
		customerName: contract.customer_name,
		phone: contract.phone,
		address: contract.address,
		weddingDate: new Date(contract.wedding_date),
		combos: contract.wedding_contract_combos?.map((c: any) => ({
			id: c.combo_id,
			comboName: c.combo_name,
			basePrice: Number(c.base_price),
			services: c.wedding_contract_combo_services?.map((s: any) => ({
				name: s.service_name,
				isRemoved: s.is_removed,
				note: s.note,
			})) || [],
		})) || [],
		mediaServices: contract.wedding_contract_extra_services
			?.filter((s: any) => s.category === "Media")
			.map((s: any) => ({
				name: s.name,
				price: Number(s.price),
				quantity: Number(s.quantity),
			})) || [],
		extraServices: contract.wedding_contract_extra_services
			?.filter((s: any) => s.category !== "Media")
			.map((s: any) => ({
				name: s.name,
				price: Number(s.price),
				quantity: Number(s.quantity),
			})) || [],
		travelFee: Number(contract.travel_fee),
		discount: Number(contract.discount),
		incurredCost: Number(contract.incurred_cost),
		incurredCostReason: contract.incurred_cost_reason,
		includeVAT: contract.include_vat,
		deposit: Number(contract.deposit),
		pickupDate: new Date(contract.pickup_date),
		contractDate: new Date(contract.contract_date),
		notes: contract.notes,
	};
}
