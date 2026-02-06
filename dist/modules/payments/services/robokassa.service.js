"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RobokassaService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const robokassa_config_1 = require("../config/robokassa.config");
class RobokassaService {
    static generateSignature(merchantLogin, amount, invoiceId, password, customParams = {}) {
        const sortedParams = Object.keys(customParams)
            .sort()
            .map((key) => `${key}=${customParams[key]}`)
            .join(":");
        const signatureString = sortedParams
            ? `${merchantLogin}:${amount}:${invoiceId}:${password}:${sortedParams}`
            : `${merchantLogin}:${amount}:${invoiceId}:${password}`;
        return crypto_1.default.createHash("md5").update(signatureString).digest("hex");
    }
    static generatePaymentUrl(params) {
        const { orderId, amount, description, userEmail, culture = "ru", encoding = "utf-8", shp_doctorId, shp_serviceType, shp_userId, } = params;
        const { merchantLogin, password1, testMode, resultUrl, successUrl, failUrl } = robokassa_config_1.robokassaConfig;
        const outSum = amount.toFixed(2);
        const invId = orderId.toString();
        const customParams = {};
        if (shp_doctorId)
            customParams.shp_doctorId = shp_doctorId;
        if (shp_serviceType)
            customParams.shp_serviceType = shp_serviceType;
        if (shp_userId)
            customParams.shp_userId = shp_userId;
        const signature = this.generateSignature(merchantLogin, outSum, invId, password1, customParams);
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
        if (userEmail)
            urlParams.append("Email", userEmail);
        if (resultUrl)
            urlParams.append("ResultURL", resultUrl);
        if (successUrl)
            urlParams.append("SuccessURL", successUrl);
        if (failUrl)
            urlParams.append("FailURL", failUrl);
        Object.entries(customParams).forEach(([key, value]) => {
            urlParams.append(key, value.toString());
        });
        const baseUrl = testMode
            ? robokassa_config_1.ROBOKASSA_URLS.payment.test
            : robokassa_config_1.ROBOKASSA_URLS.payment.production;
        return `${baseUrl}?${urlParams.toString()}`;
    }
    static verifyCallbackSignature(params) {
        const { OutSum, InvId, SignatureValue, ...rest } = params;
        const { merchantLogin, password2 } = robokassa_config_1.robokassaConfig;
        const customParams = {};
        Object.keys(rest).forEach((key) => {
            if (key.toLowerCase().startsWith("shp_")) {
                customParams[key] = rest[key];
            }
        });
        const expectedSignature = this.generateSignature(merchantLogin, OutSum, InvId, password2, customParams);
        return (SignatureValue.toLowerCase() === expectedSignature.toLowerCase());
    }
    static calculateSplitAmounts(totalAmount) {
        const { splitConfig } = robokassa_config_1.robokassaConfig;
        if (!splitConfig.enabled || !splitConfig.platformPercentage) {
            return {
                platformAmount: 0,
                doctorAmount: totalAmount,
            };
        }
        const platformAmount = parseFloat(((totalAmount * splitConfig.platformPercentage) / 100).toFixed(2));
        const doctorAmount = parseFloat((totalAmount - platformAmount).toFixed(2));
        return {
            platformAmount,
            doctorAmount,
        };
    }
    static parseCustomParams(params) {
        return {
            doctorId: params.shp_doctorId
                ? parseInt(params.shp_doctorId, 10)
                : undefined,
            serviceType: params.shp_serviceType,
            userId: params.shp_userId ? parseInt(params.shp_userId, 10) : undefined,
        };
    }
}
exports.RobokassaService = RobokassaService;
