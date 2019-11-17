import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { OracleTransactionGroup, OracleTransactionStaticFees, OracleTransactionType } from "../enums";
import { IOracleRequestAsset } from "../interfaces";
import { oracleRequestSchema } from "./utils/oracle-schemas";

const { schemas } = Transactions;

export class OracleRequestTransaction extends Transactions.Transaction {
    public static typeGroup: number = OracleTransactionGroup;
    public static type: number = OracleTransactionType.OracleRequest;
    public static key: string = "oracleRequest";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "oracleRequest",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: OracleTransactionType.OracleRequest },
                typeGroup: { const: OracleTransactionGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["oracleRequest"],
                    properties: {
                        oracleRequest: {
                            type: "object",
                            required: ["url"],
                            properties: oracleRequestSchema,
                        },
                    },
                },
            },
        });
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(
        OracleTransactionStaticFees.OracleRequest,
    );

    public serialize(): ByteBuffer {
        const { data } = this;

        const oracleRequestAsset = data.asset.oracleRequest as IOracleRequestAsset;
        const oracleRequestUrl: Buffer = Buffer.from(oracleRequestAsset.url, "utf8");

        const buffer: ByteBuffer = new ByteBuffer(oracleRequestUrl.length + 1, true);

        buffer.writeByte(oracleRequestUrl.length);
        buffer.append(oracleRequestUrl, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const requestUrlLength: number = buf.readUint8();
        const requestUrl: string = buf.readString(requestUrlLength);

        const oracleRequest: IOracleRequestAsset = {
            url: requestUrl,
        };

        data.asset = {
            oracleRequest,
        };
    }
}
