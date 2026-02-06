"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const fs_1 = __importDefault(require("fs"));
const prisma_1 = require("./modules/common/prisma");
const fastify_route_1 = require("./scripts/fastify-route");
const doctor_route_1 = require("./modules/doctors/doctor.route");
const user_route_1 = require("./modules/users/user.route");
const chat_route_1 = require("./modules/chats/chat.route");
const payment_route_1 = require("./modules/payments/payment.route");
const review_route_1 = require("./modules/reviews/review.route");
const cors_1 = __importDefault(require("@fastify/cors"));
const bot_1 = require("./bot/bot");
const multipart_1 = __importDefault(require("@fastify/multipart"));
const sharp_1 = __importDefault(require("sharp"));
const static_1 = __importDefault(require("@fastify/static"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const server = (0, fastify_1.default)({ logger: true });
const uploadsDir = path_1.default.join(process.cwd(), "uploads");
dotenv_1.default.config();
server.register(static_1.default, {
    root: uploadsDir,
    prefix: "/uploads",
});
server.register(multipart_1.default, {
    limits: { fileSize: 1024 * 1024 * 5, files: 1 },
});
server.register(cors_1.default, {
    origin: [
        "https://rozioi.pro",
        "http://localhost:3000",
        "http://localhost:5174",
        "https://soundly-primary-protozoa.cloudpub.ru",
        "https://rampantly-reasonable-millipede.cloudpub.ru",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    preflightContinue: false,
});
(0, fastify_route_1.FastifyRoute)({ fastify: server }, [
    doctor_route_1.doctorRoutes,
    user_route_1.userRoutes,
    chat_route_1.chatRoutes,
    payment_route_1.paymentRoutes,
    review_route_1.reviewRoutes,
], {
    prefix: "/api/v1",
});
server.post("/upload", async (req, reply) => {
    const file = await req.file();
    if (!file) {
        return reply.status(400).send({ error: "No file provided" });
    }
    const inputBuffer = await file.toBuffer();
    const outBuffer = await (0, sharp_1.default)(inputBuffer)
        .resize(1024, 1024)
        .jpeg({ quality: 70 })
        .toBuffer();
    const uploadsDir = "uploads";
    if (!fs_1.default.existsSync(uploadsDir)) {
        fs_1.default.mkdirSync(uploadsDir, { recursive: true });
    }
    const outputPath = `${uploadsDir}/${Date.now()}.png`;
    fs_1.default.writeFileSync(outputPath, outBuffer);
    return reply.status(200).send({
        message: "File uploaded successfully",
        path: outputPath,
        originalSize: inputBuffer.length,
        compressedSize: outBuffer.length,
    });
});
server.get("/users", async (request, reply) => {
    try {
        const users = await prisma_1.prisma.user.findMany();
        return { users };
    }
    catch (error) {
        server.log.error(error);
        return reply.status(500).send({ error: "Internal Server Error" });
    }
});
server.get("/users/:id", async (request, reply) => {
    try {
        const { id } = request.params;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: parseInt(id) },
        });
        if (!user) {
            return reply.status(404).send({ error: "User not found" });
        }
        return { user };
    }
    catch (error) {
        server.log.error(error);
        return reply.status(500).send({ error: "Internal Server Error" });
    }
});
server.get("/", async (request, reply) => {
    try {
        return {
            message: "Doctor Chat Server API",
            version: "1.0.0",
            endpoints: [
                { path: "/", method: "GET", description: "API information" },
                { path: "/test-user", method: "POST", description: "Create test user" },
                { path: "/users", method: "POST", description: "Create new user" },
                { path: "/users", method: "GET", description: "Get all users" },
                { path: "/users/:id", method: "GET", description: "Get user by ID" },
            ],
        };
    }
    catch (error) {
        server.log.error(error);
        return reply.status(500).send({ error: "Internal Server Error" });
    }
});
server.get("/api/v1/health", async (request, reply) => {
    const userAgent = request.headers["user-agent"];
    return {
        status: "ok",
        success: true,
        message: "Server is running",
        userAgent,
        timestamp: new Date().toISOString(),
    };
});
const start = async () => {
    try {
        await server.listen({ port: 5174, host: "0.0.0.0" });
        console.log("✅ Server started successfully");
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
(0, bot_1.startBot)();
