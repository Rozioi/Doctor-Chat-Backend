import crypto from "crypto";
import { robokassaConfig, ROBOKASSA_URLS } from "../config/robokassa.config";

export interface RobokassaPaymentParams {
    orderId: string | number;
    amount: number;
    description: string;
    userEmail?: string;
    culture?: "ru" | "en";
    encoding?: "utf-8";
    // Additional custom parameters
    shp_doctorId?: number;
    shp_serviceType?: string;
    shp_userId?: number;
}

export interface RobokassaCallbackParams {
    OutSum: string;
    InvId: string;
    SignatureValue: string;
    [key: string]: string; // For custom shp_ parameters
}

export class RobokassaService {
    /**
     * Generate MD5 signature for payment URL
     */
    private static generateSignature(
        merchantLogin: string,
        amount: string,
        invoiceId: string,
        password: string,
        customParams: Record<string, string | number> = {},
    ): string {
        // Sort custom parameters by key
        const sortedParams = Object.keys(customParams)
            .sort()
            .map((key) => `${key}=${customParams[key]}`)
            .join(":");

        // Signature format: MerchantLogin:OutSum:InvId:Password[:Shp_param1=value1:Shp_param2=value2...]
        const signatureString = sortedParams
            ? `${merchantLogin}:${amount}:${invoiceId}:${password}:${sortedParams}`
            : `${merchantLogin}:${amount}:${invoiceId}:${password}`;

        return crypto.createHash("md5").update(signatureString).digest("hex");
    }

    /**
     * Generate payment URL for Robokassa
     */
    static generatePaymentUrl(params: RobokassaPaymentParams): string {
        const {
            orderId,
            amount,
            description,
            userEmail,
            culture = "ru",
            encoding = "utf-8",
            shp_doctorId,
            shp_serviceType,
            shp_userId,
        } = params;

        const { merchantLogin, password1, testMode, resultUrl, successUrl, failUrl } =
            robokassaConfig;

        // Format amount to 2 decimal places
        const outSum = amount.toFixed(2);
        const invId = orderId.toString();

        // Collect custom parameters (shp_*)
        const customParams: Record<string, string | number> = {};
        if (shp_doctorId) customParams.shp_doctorId = shp_doctorId;
        if (shp_serviceType) customParams.shp_serviceType = shp_serviceType;
        if (shp_userId) customParams.shp_userId = shp_userId;

        // Generate signature
        const signature = this.generateSignature(
            merchantLogin,
            outSum,
            invId,
            password1,
            customParams,
        );

        // Build URL parameters
        const urlParams = new URLSearchParams({
            MerchantLogin: merchantLogin,
            OutSum: outSum,
            InvId: invId,
            Description: description,
            SignatureValue: signature,
            Culture: culture,
            Encoding: encoding,
            IsTest: testMode ? "1" : "0",
        });

        // Add optional parameters
        if (userEmail) urlParams.append("Email", userEmail);
        if (resultUrl) urlParams.append("ResultURL", resultUrl);
        if (successUrl) urlParams.append("SuccessURL", successUrl);
        if (failUrl) urlParams.append("FailURL", failUrl);

        // Add custom parameters
        Object.entries(customParams).forEach(([key, value]) => {
            urlParams.append(key, value.toString());
        });

        // Select payment URL based on test mode
        const baseUrl = testMode
            ? ROBOKASSA_URLS.payment.test
            : ROBOKASSA_URLS.payment.production;

        return `${baseUrl}?${urlParams.toString()}`;
    }

    /**
     * Verify callback signature from Robokassa Result URL
     */
    static verifyCallbackSignature(params: RobokassaCallbackParams): boolean {
        const { OutSum, InvId, SignatureValue, ...rest } = params;
        const { merchantLogin, password2 } = robokassaConfig;

        // Extract custom parameters (shp_*)
        const customParams: Record<string, string | number> = {};
        Object.keys(rest).forEach((key) => {
            if (key.toLowerCase().startsWith("shp_")) {
                customParams[key] = rest[key];
            }
        });

        // Generate expected signature
        const expectedSignature = this.generateSignature(
            merchantLogin,
            OutSum,
            InvId,
            password2,
            customParams,
        );

        // Compare signatures (case-insensitive)
        return (
            SignatureValue.toLowerCase() === expectedSignature.toLowerCase()
        );
    }

    /**
     * Calculate payment split amounts
     */
    static calculateSplitAmounts(totalAmount: number): {
        platformAmount: number;
        doctorAmount: number;
    } {
        const { splitConfig } = robokassaConfig;

        if (!splitConfig.enabled || !splitConfig.platformPercentage) {
            return {
                platformAmount: 0,
                doctorAmount: totalAmount,
            };
        }

        const platformAmount = parseFloat(
            ((totalAmount * splitConfig.platformPercentage) / 100).toFixed(2),
        );
        const doctorAmount = parseFloat((totalAmount - platformAmount).toFixed(2));

        return {
            platformAmount,
            doctorAmount,
        };
    }

    /**
     * Parse custom parameters from callback
     */
    static parseCustomParams(params: RobokassaCallbackParams): {
        doctorId?: number;
        serviceType?: string;
        userId?: number;
    } {
        return {
            doctorId: params.shp_doctorId
                ? parseInt(params.shp_doctorId, 10)
                : undefined,
            serviceType: params.shp_serviceType,
            userId: params.shp_userId ? parseInt(params.shp_userId, 10) : undefined,
        };
    }
}
