import fastify, { FastifyReply } from "fastify";
import fs from "fs";
import { prisma } from "./modules/common/prisma";
import { FastifyRoute } from "./scripts/fastify-route";
import { doctorRoutes } from "./modules/doctors/doctor.route";
import { userRoutes } from "./modules/users/user.route";
import { chatRoutes } from "./modules/chats/chat.route";
import { paymentRoutes } from "./modules/payments/payment.route";
import { reviewRoutes } from "./modules/reviews/review.route";
import { balanceRoutes } from "./modules/balance/balance.route";
import fastifyCors from "@fastify/cors";
import { startBot } from "./bot/bot";
import fastifyMultipart from "@fastify/multipart";
import sharp from "sharp";
import fastifyStatic from "@fastify/static";
import dotenv from "dotenv";
import formbody from "@fastify/formbody";
import path from "path";
import { createFreedomPayService } from "./modules/payments/services/freedompay.service";
import { createKaspiService } from "./modules/payments/services/kaspi.service";
const server = fastify({ logger: true });
const uploadsDir = path.join(process.cwd(), "uploads");

dotenv.config();

server.addContentTypeParser(
  "application/json",
  { parseAs: "string" },
  (req, body, done) => {
    try {
      const json = JSON.parse(body as string);
      (req as any).rawBody = body;
      done(null, json);
    } catch (err) {
      err.status = 400;
      done(err, null);
    }
  },
);

server.register(fastifyStatic, {
  root: uploadsDir,
  prefix: "/uploads",
});

server.register(formbody);
server.register(fastifyMultipart, {
  limits: { fileSize: 1024 * 1024 * 10, files: 1 },
});
server.register(fastifyCors, {
  origin: (origin, cb) => {
    if (
      !origin ||
      origin.endsWith(".cloudpub.ru") ||
      origin === "http://bpapi.bazarbay.site" ||
      origin === "https://doctor-chat-c-lient.vercel.app" ||
      origin === "https://rozioi.pro"
    ) {
      cb(null, true);
      return;
    }
    cb(new Error("Not allowed by CORS"), false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-telegram-user-id"],
  credentials: true,
});

const freedomPayService = createFreedomPayService({
  merchantId: process.env.MERCHANT_ID!,
  secretKey: process.env.SECRET_KEY!,
  paymentUrl: process.env.PAYMENT_URL!,
  resultUrl: process.env.RESULT_URL!,
  successUrl: process.env.SUCCESS_URL!,
  failureUrl: process.env.FAIL_URL!,
});
const kaspiService = createKaspiService({
  apiKey:
    process.env.APIPAY_API_KEY! ||
    "6c1147b55e21726f5131bd93fee83b699167a0affa4542555a79f75e1dafe3c9",
  webhookSecret:
    process.env.APIPAY_WEBHOOK_SECRET! ||
    "ba42d7b6e8dc2cb4895090c45a0275163c7e8ca246bb30a0c6d19c6ea50d21fb",
  baseUrl: process.env.APIPAY_BASE_URL || "https://bpapi.bazarbay.site/api/v1",
  itemPrice: Number(process.env.KASPI_ITEM_PRICE) || 65000,
  catalogItemId: Number(process.env.KASPI_CATALOG_ITEM_ID) || 608544,
});

server.register(paymentRoutes, {
  freedomPayService,
  kaspiService,
});

FastifyRoute(
  { fastify: server },
  [doctorRoutes, userRoutes, chatRoutes, reviewRoutes, balanceRoutes],
  {
    prefix: "/api/v1",
  },
);

server.post("/upload", async (req, reply) => {
  try {
    const file = await req.file();

    if (!file) {
      return reply.status(400).send({ error: "No file provided" });
    }
    const inputBuffer = await file.toBuffer();
    const isImage = file.mimetype.startsWith("image/");
    const extension = path.extname(file.filename) || (isImage ? ".png" : "");
    const fileName = `${Date.now()}${extension}`;
    const outputPath = path.join(uploadsDir, fileName);

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    if (isImage) {
      const compressedFileName = fileName.replace(extension, ".jpg");
      const compressedPath = path.join(uploadsDir, compressedFileName);
      const outBuffer = await sharp(inputBuffer)
        .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toBuffer();
      fs.writeFileSync(compressedPath, outBuffer);
      return reply.status(200).send({
        message: "Image uploaded and compressed successfully",
        path: `uploads/${compressedFileName}`,
        originalSize: inputBuffer.length,
        compressedSize: outBuffer.length,
      });
    } else {
      fs.writeFileSync(outputPath, inputBuffer);
      return reply.status(200).send({
        message: "File uploaded successfully",
        path: `uploads/${fileName}`,
        originalSize: inputBuffer.length,
        compressedSize: inputBuffer.length,
      });
    }
  } catch (error: any) {
    server.log.error(error);
    return reply.status(500).send({ error: error.message || "Upload failed" });
  }
});

server.get("/users", async (request, reply) => {
  try {
    const users = await prisma.user.findMany();
    return { users };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
});

server.get("/users/:id", async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    return { user };
  } catch (error) {
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
  } catch (error) {
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
    const port = Number(process.env.PORT) || 5174;
    await server.listen({ port, host: "0.0.0.0" });
    console.log(`✅ Server started successfully on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
startBot();
