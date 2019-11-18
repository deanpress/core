export const oracleRequestSchema = {
    url: {
        $ref: "uri",
    },
};

export const oracleResultSchema = {
    request: {
        $ref: "transactionId",
    },
    responseCode: {
        type: "integer",
    },
    result: {
        type: "string",
    },
};
