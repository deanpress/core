import { Container, Logger } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { defaults } from "./defaults";
import { OracleRequestTransactionHandler, OracleResultTransactionHandler } from "./handlers";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    required: true,
    alias: "oracle-transactions",
    async register(container: Container.IContainer, options) {
        const logger = container.resolvePlugin<Logger.ILogger>("logger");
        logger.info("Setting up core-plugin-oracle-transactions.");
        Handlers.Registry.registerTransactionHandler(OracleRequestTransactionHandler);
        Handlers.Registry.registerTransactionHandler(OracleResultTransactionHandler);
    },

    // tslint:disable-next-line: no-empty
    async deregister(container: Container.IContainer, options) {},
};
