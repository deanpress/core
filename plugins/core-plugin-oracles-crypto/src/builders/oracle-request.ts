import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { OracleTransactionGroup, OracleTransactionType } from "../enums";
import { IOracleRequestAsset } from "../interfaces";
import { OracleRequestTransaction } from "../transactions";

export class OracleRequestBuilder extends Transactions.TransactionBuilder<OracleRequestBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = OracleTransactionGroup;
        this.data.type = OracleTransactionType.OracleRequest;
        this.data.fee = OracleRequestTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { oracleRequest: {} };
    }

    public oracleRequestAsset(oracleRequestAsset: IOracleRequestAsset): OracleRequestBuilder {
        this.data.asset.oracleRequest = {
            ...oracleRequestAsset,
        };
        return this;
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): OracleRequestBuilder {
        return this;
    }
}
