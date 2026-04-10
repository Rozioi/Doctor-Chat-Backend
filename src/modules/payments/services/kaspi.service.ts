import crypto from "crypto";

export interface KaspiInvoiceResponse {
  id: number;
  external_order_id: string;
  amount: string;
  status: string;
  kaspi_invoice_id?: string;
}

export interface KaspiConfig {
  apiKey: string;
  webhookSecret: string;
  baseUrl: string;
  itemPrice: number;
  catalogItemId: number;
}

export const createKaspiService = (config: KaspiConfig) => {
  const createInvoice = async (data: {
    amount: number;
    phoneNumber: string;
    externalOrderId: string;
    description: string;
  }) => {
    console.log(config);
    const response = await fetch(`${config.baseUrl}/invoices`, {
      method: "POST",
      headers: {
        "X-API-Key": config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cart_items: [
          {
            catalog_item_id: config.catalogItemId,
            count: 1,
            price: config.itemPrice,
          },
        ],
        phone_number: data.phoneNumber.replace("+", ""),
        description: data.description,
      }),
    });
    // Read body ONCE — stream can only be consumed one time
    const responseData = await response.json();
    console.log("Kaspi invoice response:", responseData);

    if (!response.ok) {
      throw new Error(
        responseData?.message ||
          `Failed to create Kaspi invoice: ${response.statusText}`,
      );
    }

    return responseData as KaspiInvoiceResponse;
  };

  const verifySignature = (payload: string, signature: string): boolean => {
    if (!signature) return false;

    // Signature format is usually "sha256=<hex>"
    const [algo, receivedHash] = signature.split("=");
    if (algo !== "sha256") return false;

    const expectedHash = crypto
      .createHmac("sha256", config.webhookSecret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedHash),
      Buffer.from(receivedHash),
    );
  };

  return {
    createInvoice,
    verifySignature,
    config, // Exposing config for components that need the price
  };
};
