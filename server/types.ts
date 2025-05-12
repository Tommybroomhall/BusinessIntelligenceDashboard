import { leadStatusEnum, orderStatusEnum } from "@shared/schema";

export type OrderStatus = typeof orderStatusEnum.enumValues[number];
export type LeadStatus = typeof leadStatusEnum.enumValues[number];
