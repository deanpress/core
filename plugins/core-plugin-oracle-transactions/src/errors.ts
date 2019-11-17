// tslint:disable:max-classes-per-file
import { Errors } from "@arkecosystem/core-transactions";

export class SenderNotActiveDelegateError extends Errors.TransactionError {
    constructor() {
        super("Failed to apply transaction, because wallet is not an active forging delegate.");
    }
}

export class RequestTransactionNotFoundError extends Errors.TransactionError {
    constructor() {
        super("Failed to apply transaction, because the request transaction id does not exist.");
    }
}
