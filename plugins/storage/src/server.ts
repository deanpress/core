import { createServer, mountServer } from "@arkecosystem/core-http-utils";
import { notFound } from "@hapi/boom";
import { Oracle } from "./entities";

export const startServer = async config => {
    const server = await createServer({
        host: config.host,
        port: config.port,
        routes: {
            cors: true,
        },
    });

    // Statistics
    server.route({
        method: "GET",
        path: "/oracle/{requestId}",
        async handler(request, h) {
            const results = await Oracle.find({ requestId: request.params.requestId });
            if (results) {
                return results;
            } else {
                return notFound();
            }
        },
    });

    return mountServer("nOS Storage Server", server);
};
