import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { OracleTransactionGroup, OracleTransactionType } from "../enums";
import { IOracleResultAsset } from "../interfaces";
import { OracleResultTransaction } from "../transactions";

export class OracleResultBuilder extends Transactions.TransactionBuilder<OracleResultBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = OracleTransactionGroup;
        this.data.type = OracleTransactionType.OracleResult;
        this.data.fee = OracleResultTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { OracleResultTransaction: {} };
    }

    public oracleResultAsset(oracleResultAsset: IOracleResultAsset): OracleResultBuilder {
        this.data.asset.oracleResult = {
            ...oracleResultAsset,
        };
        return this;
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): OracleResultBuilder {
        return this;
    }
}
