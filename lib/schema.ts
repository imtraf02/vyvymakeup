import { z } from "zod";

export const settingsSchema = z.object({
  studioName: z.string().min(1, "Vui lòng nhập tên studio"),
  address: z.string().min(1, "Vui lòng nhập địa chỉ"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().min(1, "Vui lòng nhập số điện thoại"),
  bankAccounts: z.array(z.object({
    bank: z.string().min(1, "Vui lòng nhập tên ngân hàng"),
    account: z.string().min(1, "Vui lòng nhập số tài khoản"),
    owner: z.string().min(1, "Vui lòng nhập tên chủ tài khoản"),
  })),
  backgroundUrl: z.string().optional(),
  signatureUrl: z.string().optional(),
});

export type SettingsSchema = z.infer<typeof settingsSchema>;

export const weddingContractSchema = z.object({
  customerName: z.string().min(1, "Vui lòng nhập tên khách hàng"),
  phone: z.string().optional().refine(val => !val || /^0\d{9}$/.test(val), "Số điện thoại không hợp lệ"),
  address: z.string().min(1, "Vui lòng nhập địa chỉ"),
  weddingDate: z.date({
    required_error: "Vui lòng chọn ngày cưới",
  }),
  combos: z.array(z.object({
    id: z.string().optional(), // template id
    comboName: z.string().min(1, "Vui lòng nhập tên combo"),
    basePrice: z.coerce.number().min(0).default(0),
    services: z.array(z.object({
      name: z.string().min(1, "Tên dịch vụ không được để trống"),
      isRemoved: z.boolean().default(false),
      note: z.string().optional(),
    })).min(1, "Combo phải có ít nhất một dịch vụ"),
  })).default([]),
  travelFee: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  incurredCost: z.coerce.number().min(0).default(0),
  incurredCostReason: z.string().optional(),
  includeVAT: z.boolean().default(false),
  deposit: z.coerce.number().min(0).default(0),
  pickupDate: z.date({
    required_error: "Vui lòng chọn ngày hẹn lấy",
  }),
  contractDate: z.date({
    required_error: "Vui lòng chọn ngày lập hợp đồng",
  }),
  mediaServices: z.array(z.object({
    name: z.string().min(1, "Tên dịch vụ không được để trống"),
    price: z.coerce.number().min(0),
    quantity: z.coerce.number().min(1).default(1),
  })).default([]),
  extraServices: z.array(z.object({
    name: z.string().min(1, "Tên dịch vụ không được để trống"),
    price: z.coerce.number().min(0),
    quantity: z.coerce.number().min(1).default(1),
  })).default([]),
  notes: z.string().optional(),
});

export type WeddingContractSchema = z.infer<typeof weddingContractSchema>;
