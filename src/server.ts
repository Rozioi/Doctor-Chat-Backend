import fastify, { FastifyReply } from "fastify";
import fs from "fs";
import { prisma } from "./modules/common/prisma";
import { FastifyRoute } from "./scripts/fastify-route";
import { doctorRoutes } from "./modules/doctors/doctor.route";
import { userRoutes } from "./modules/users/user.route";
import { chatRoutes } from "./modules/chats/chat.route";
import { paymentRoutes } from "./modules/payments/payment.route";
import { reviewRoutes } from "./modules/reviews/review.route";
import fastifyCors from "@fastify/cors";
import { startBot } from "./bot/bot";
import fastifyMultipart from "@fastify/multipart";
import sharp from "sharp";
import fastifyStatic from "@fastify/static";
import dotenv from "dotenv";

import path from "path";
const server = fastify({ logger: true });
const uploadsDir = path.join(process.cwd(), "uploads");

dotenv.config();

server.register(fastifyStatic, {
  root: uploadsDir,
  prefix: "/uploads",
});
server.register(fastifyMultipart, {
  limits: { fileSize: 1024 * 1024 * 5, files: 1 },
});
server.register(fastifyCors, {
  origin: [
    "https://rozioi.pro",
    "*",
    "http://localhost:3000",
    "http://localhost:5174",
    "https://soundly-primary-protozoa.cloudpub.ru",
    "https://doctor-chat-c-lient.vercel.app",
    "https://rampantly-reasonable-millipede.cloudpub.ru",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  preflightContinue: false,
});
FastifyRoute(
  { fastify: server },
  [
    doctorRoutes,
    userRoutes,
    chatRoutes,
    paymentRoutes,
    reviewRoutes,
    // PDF теперь не через БД/роуты, а как обычные статические файлы в /uploads
  ],
  {
    prefix: "/api/v1",
  },
);

server.post("/upload", async (req, reply) => {
  const file = await req.file();

  if (!file) {
    return reply.status(400).send({ error: "No file provided" });
  }
  const inputBuffer = await file.toBuffer();

  const outBuffer = await sharp(inputBuffer)
    .resize(1024, 1024)
    .jpeg({ quality: 70 })
    .toBuffer();
  const uploadsDir = "uploads";
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const outputPath = `${uploadsDir}/${Date.now()}.png`;
  fs.writeFileSync(outputPath, outBuffer);
  return reply.status(200).send({
    message: "File uploaded successfully",
    path: outputPath,
    originalSize: inputBuffer.length,
    compressedSize: outBuffer.length,
  });
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
// Запуск сервера
const start = async () => {
  try {
    await server.listen({ port: 5174, host: "0.0.0.0" });
    console.log("✅ Server started successfully");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
startBot();
