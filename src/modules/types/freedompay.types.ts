export interface CreatePaymentDto {
  amount: number;
  currency?: string;
  doctorId: number;
  serviceType: string;
  tariffType?: string;
  telegramId?: string;
}

export interface FreedomPayResult {
  pg_order_id: string;
  pg_payment_status: string;
  pg_amount: string;
  pg_sig: string;
  [key: string]: any;
}
