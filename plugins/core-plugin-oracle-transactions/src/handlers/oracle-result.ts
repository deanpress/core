import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces as TransactionInterfaces } from "@arkecosystem/core-transactions";
import { roundCalculator } from "@arkecosystem/core-utils";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import {
    Interfaces as OracleInterfaces,
    Transactions as OracleTransactions,
} from "@deanpress/core-plugin-oracles-crypto";
import { RequestTransactionNotFoundError, SenderNotActiveDelegateError } from "../errors";
import { OracleEvents } from "../events";

export class OracleResultTransactionHandler extends Handlers.TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return OracleTransactions.OracleResultTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async isActivated(): Promise<boolean> {
        return true;
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        return;
    }

    public dynamicFee(context: TransactionInterfaces.IDynamicFeeContext): Utils.BigNumber {
        // override dynamicFee calculation as this is a zero-fee transaction
        return Utils.BigNumber.ZERO;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        // Error if sender is not active delegate
        const database: Database.IDatabaseService = app.resolvePlugin("database");
        const lastBlock = await database.getLastBlock();
        const roundInfo = roundCalculator.calculateRound(lastBlock.data.height);
        const delegates: State.IWallet[] = await database.getActiveDelegates(roundInfo);
        if (!delegates.find(delegate => delegate.publicKey === transaction.data.senderPublicKey)) {
            throw new SenderNotActiveDelegateError();
        }

        // Error if request tx id cannot be found
        const oracleResult: OracleInterfaces.IOracleResultAsset = transaction.data.asset.oracleResult;
        const requestTx: Interfaces.ITransactionData = await database.getTransaction(oracleResult.request);
        if (!requestTx) {
            throw new RequestTransactionNotFoundError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit(OracleEvents.OracleResultPosted, transaction.data);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<boolean> {
        const oracleResult: OracleInterfaces.IOracleResultAsset = data.asset.oracleResult.request;

        // Make sure there's only one result for the oracle request by the same delegate in the transaction payload
        const oracleResultSameRequestInPayload = processor
            .getTransactions()
            .filter(
                tx =>
                    tx.type === this.getConstructor().type &&
                    tx.asset.oracleResult.request === oracleResult.request &&
                    tx.senderPublicKey === data.senderPublicKey,
            );
        if (oracleResultSameRequestInPayload.length > 1) {
            processor.pushError(
                data,
                "ERR_CONFLICT",
                `Multiple results for "${oracleResult.request}" by this delegate in transaction payload`,
            );
            return false;
        }

        // Make sure there's only one result for this oracle request by the same delegate in the transaction pool
        const oracleResultsInPool: Interfaces.ITransactionData[] = Array.from(
            await pool.getTransactionsByType(this.getConstructor().type),
        ).map((memTx: Interfaces.ITransaction) => memTx.data);
        const containsOracleResultBySameDelegateInPool: boolean = oracleResultsInPool.some(
            transaction =>
                transaction.asset.oracleResult.request === oracleResult.request &&
                transaction.senderPublicKey === data.senderPublicKey,
        );
        if (containsOracleResultBySameDelegateInPool) {
            processor.pushError(
                data,
                "ERR_PENDING",
                `Oracle result for "${oracleResult.request}" by same delegate already in the pool`,
            );
            return false;
        }

        return true;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);
        return;
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);
        return;
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {
        return;
    }

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line:no-empty
    ): Promise<void> {
        return;
    }
}
