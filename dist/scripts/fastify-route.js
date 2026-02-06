"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FastifyRoute = FastifyRoute;
function FastifyRoute(depends, handlers, options) {
    const { fastify } = depends;
    fastify.register(async (instance) => {
        for (const handler of handlers) {
            await handler(instance, {}, async () => { });
        }
    }, options);
}
