// Re-export types from shared/types.ts for backward compatibility
export {
  OrderStatus,
  LeadStatus,
  StockLevel,
  CustomerStatus,
  User,
  Tenant,
  Product,
  Order,
  OrderItem,
  Lead,
  TrafficData,
  ActivityLog
} from "@shared/types";

// Import the IStorage interface from storage.ts
import { IStorage } from "./storage";
export { IStorage };
