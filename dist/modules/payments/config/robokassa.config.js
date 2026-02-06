"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROBOKASSA_URLS = exports.robokassaConfig = void 0;
exports.robokassaConfig = {
    merchantLogin: process.env.ROBOKASSA_MERCHANT_LOGIN || "demo_merchant",
    password1: process.env.ROBOKASSA_PASSWORD1 || "test_password1",
    password2: process.env.ROBOKASSA_PASSWORD2 || "test_password2",
    testMode: process.env.ROBOKASSA_TEST_MODE !== "false",
    resultUrl: process.env.ROBOKASSA_RESULT_URL ||
        "https://frightfully-desirable-baboon.cloudpub.ru/api/payments/robokassa/result",
    successUrl: process.env.ROBOKASSA_SUCCESS_URL ||
        "https://frightfully-desirable-baboon.cloudpub.ru/payment/success",
    failUrl: process.env.ROBOKASSA_FAIL_URL ||
        "https://frightfully-desirable-baboon.cloudpub.ru/payment/fail",
    splitConfig: {
        enabled: process.env.ROBOKASSA_SPLIT_ENABLED === "true",
        platformMerchantId: process.env.ROBOKASSA_PLATFORM_MERCHANT,
        platformPercentage: parseFloat(process.env.ROBOKASSA_PLATFORM_PERCENTAGE || "10"),
    },
};
exports.ROBOKASSA_URLS = {
    payment: {
        test: "https://auth.robokassa.ru/Merchant/Index.aspx",
        production: "https://auth.robokassa.ru/Merchant/Index.aspx",
    },
    api: {
        test: "https://auth.robokassa.ru/Merchant/WebService/Service.asmx",
        production: "https://auth.robokassa.ru/Merchant/WebService/Service.asmx",
    },
};
