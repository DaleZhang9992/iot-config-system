export type UserRole = "SALES" | "FAE" | "RD" | "ADMIN";

export type OrderStatus =
  | "PENDING_CONFIG"
  | "FAE_CONFIGURED"
  | "LINK_SENT"
  | "CUSTOMER_SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED";

export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ParamDataType =
  | "STRING"
  | "NUMBER"
  | "ENUM"
  | "BOOLEAN"
  | "IP_ADDRESS"
  | "HEX_STRING";

export interface OrderWithStatus {
  id: string;
  orderNo: string;
  model: string;
  quantity: number;
  orderDate: string;
  status: OrderStatus;
  customerName: string | null;
  customerEmail: string | null;
  linkToken: string | null;
  salesUser: { id: string; name: string; email: string };
  template: { id: string } | null;
  createdAt: string;
}

export interface ATCommandParamDef {
  id?: string;
  paramKey: string;
  displayName: string;
  description?: string;
  dataType: ParamDataType;
  isRequired: boolean;
  defaultValue?: string;
  unit?: string;
  minValue?: number | null;
  maxValue?: number | null;
  step?: number | null;
  enumValues?: string;
  regexPattern?: string;
  regexHint?: string;
  sortOrder: number;
  groupName?: string;
}
