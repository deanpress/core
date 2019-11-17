import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { OracleTransactionGroup, OracleTransactionStaticFees, OracleTransactionType } from "../enums";
import { IOracleResultAsset } from "../interfaces";
import { oracleResultSchema } from "./utils/oracle-schemas";

const { schemas } = Transactions;

export class OracleResultTransaction extends Transactions.Transaction {
    public static typeGroup: number = OracleTransactionGroup;
    public static type: number = OracleTransactionType.OracleResult;
    public static key: string = "oracleResult";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "oracleResult",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: OracleTransactionType.OracleResult },
                typeGroup: { const: OracleTransactionGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["oracleResult"],
                    properties: {
                        oracleResult: {
                            type: "object",
                            required: ["request", "responseCode", "result"],
                            properties: oracleResultSchema,
                        },
                    },
                },
            },
        });
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(OracleTransactionStaticFees.OracleResult);

    public serialize(): ByteBuffer {
        const { data } = this;

        const oracleResultAsset = data.asset.oracleResult as IOracleResultAsset;
        const oracleResultRequest: Buffer = Buffer.from(oracleResultAsset.request, "utf8");
        const oracleResultResponseCode: Buffer = Buffer.from(oracleResultAsset.responseCode.toString(), "utf8");
        const oracleResultValue: Buffer = Buffer.from(oracleResultAsset.result, "utf8");

        const buffer: ByteBuffer = new ByteBuffer(
            oracleResultRequest.length + oracleResultResponseCode.length + oracleResultValue.length + 3,
            true,
        );

        buffer.writeByte(oracleResultRequest.length);
        buffer.append(oracleResultRequest, "hex");
        buffer.writeByte(oracleResultResponseCode.length);
        buffer.append(oracleResultResponseCode, "hex");
        buffer.writeByte(oracleResultValue.length);
        buffer.append(oracleResultValue, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const requestLength: number = buf.readUint8();
        const request: string = buf.readString(requestLength);
        const responseCodeLength: number = buf.readUint8();
        const responseCode: number = Number(buf.readString(responseCodeLength));
        const resultLength: number = buf.readUint8();
        const result: string = buf.readString(resultLength);

        const oracleResult: IOracleResultAsset = {
            request,
            responseCode,
            result,
        };

        data.asset = {
            oracleResult,
        };
    }
}
