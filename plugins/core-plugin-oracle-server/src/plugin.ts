import { app } from "@arkecosystem/core-container";
import { Container, State } from "@arkecosystem/core-interfaces";
import { Database, EventEmitter, Logger } from "@arkecosystem/core-interfaces";
import { roundCalculator } from "@arkecosystem/core-utils";
import { Identities, Interfaces, Transactions } from "@arkecosystem/crypto";
import {
    Builders as OracleBuilders,
    Interfaces as OracleInterfaces,
    Transactions as OracleTransactions,
} from "@deanpress/core-plugin-oracles-crypto";
import { Oracle, q } from "@nosplatform/storage";
import got from "got";
import { defaults } from "./defaults";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "oracle-server",
    async register(container: Container.IContainer, options) {
        const logger = app.resolvePlugin<Logger.ILogger>("logger");
        const emitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
        logger.info("Registering Oracle Server");
        const secrets = app.getConfig().get("delegates.secrets");
        if (secrets.length) {
            const secret = secrets[0];
            const publicKey = Identities.PublicKey.fromPassphrase(secret);
            const walletManager: State.IWalletManager = app.resolvePlugin("database").walletManager;
            const wallet: State.IWallet = walletManager.findByPublicKey(publicKey);

            Transactions.TransactionRegistry.registerTransactionType(OracleTransactions.OracleResultTransaction);
            emitter.on("oracle.requested", async (transactionData: Interfaces.ITransactionData) => {
                // Check if active delegate
                const database: Database.IDatabaseService = app.resolvePlugin("database");
                const lastBlock = await database.getLastBlock();
                const roundInfo = roundCalculator.calculateRound(lastBlock.data.height);
                const delegates: State.IWallet[] = await database.getActiveDelegates(roundInfo);

                if (delegates.includes(wallet)) {
                    const oracleRequest: OracleInterfaces.IOracleRequestAsset = transactionData.asset.oracleRequest;
                    logger.info(`New Oracle requested for ${oracleRequest.url}}`);
                    const response = await got.get(oracleRequest.url, { json: true });
                    const responseCode = response.statusCode;
                    logger.info(`Got status code ${responseCode} for ${oracleRequest.url}`);
                    const result = JSON.stringify(response.body);
                    logger.info(`Got response body ${result} for ${oracleRequest.url}`);
                    const builder = new OracleBuilders.OracleResultBuilder();

                    const oracleResult: OracleInterfaces.IOracleResultAsset = {
                        request: transactionData.id,
                        responseCode,
                        result,
                    };

                    try {
                        const oracleResultTx = builder
                            .oracleResultAsset(oracleResult)
                            .sign(secret)
                            .getStruct();
                        const txResult = await got.post(`http://localhost:${process.env.CORE_API_PORT}/transactions`, {
                            json: true,
                            body: { transactions: [oracleResultTx] },
                        });
                        if (txResult.statusCode === 200 && txResult.body.data.accept.length > 0) {
                            logger.info(`Transaction success: ${oracleResultTx.id}`);
                        } else {
                            logger.error(`Transaction posting error`);
                            logger.error(txResult.body);
                        }
                    } catch (error) {
                        logger.error(error);
                    }
                } else {
                    logger.info("Not handling oracle request since I'm not an active delegate.");
                }
            });

            // On new result
            emitter.on("oracle.resultPosted", async (transactionData: Interfaces.ITransactionData) => {
                q(async () => {
                    const oracleResult: OracleInterfaces.IOracleResultAsset = transactionData.asset.oracleResult;
                    const oracle = new Oracle();
                    oracle.requestId = oracleResult.request;
                    oracle.resultId = transactionData.id;
                    oracle.save();
                    logger.info(`Saved new oracle result to db: ${oracle.request_id} : ${oracle.result_id}`);
                });
            });
        }
    },
    async deregister(container: Container.IContainer, options) {
        /* Stop plugin here */
    },
};
