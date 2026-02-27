import crypto from "crypto";
import { XMLParser } from "fast-xml-parser";

interface FreedomPayConfig {
  merchantId: string;
  secretKey: string;
  paymentUrl: string;
  resultUrl: string;
  successUrl: string;
  failureUrl: string;
}

export const createFreedomPayService = (config: FreedomPayConfig) => {
  const makeSignature = (
    scriptName: string,
    params: Record<string, any>,
  ): string => {
    const sortedKeys = Object.keys(params).sort();
    const values = sortedKeys.map((key) => params[key]);
    const signatureString = [scriptName, ...values, config.secretKey].join(";");

    return crypto.createHash("md5").update(signatureString).digest("hex");
  };

  const createPayment = async (data: {
    amount: number;
    orderId: string;
    currency?: string;
  }) => {
    const params: Record<string, any> = {
      pg_merchant_id: config.merchantId,
      pg_order_id: data.orderId,
      pg_amount: data.amount,
      pg_currency: data.currency ?? "KZT",
      pg_description: `Оплата заказа ${data.orderId}`,
      pg_language: "ru",
      pg_testing_mode: process.env.NODE_ENV === "production" ? 0 : 1,
      pg_salt: Math.random().toString(36).substring(2),
      pg_result_url: config.resultUrl,
      pg_success_url: config.successUrl,
      pg_failure_url: config.failureUrl,
    };

    params.pg_sig = makeSignature("init_payment.php", params);

    const response = await fetch(config.paymentUrl, {
      method: "POST",
      body: new URLSearchParams(params),
    });

    const parser = new XMLParser();

    const responseText = await response.text();
    const parsed = parser.parse(responseText);

    const dataz = parsed.response;

    if (dataz.pg_status !== "ok") {
      throw new Error("Payment init failed");
    }

    return dataz;
  };

  const validateResult = (params: Record<string, any>): boolean => {
    const receivedSig = params.pg_sig;
    delete params.pg_sig;

    const calculatedSig = makeSignature("result.php", params);

    return calculatedSig === receivedSig;
  };

  return {
    createPayment,
    validateResult,
  };
};
