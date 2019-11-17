export interface IOracleRequestAsset {
    url: string;
}

export interface IOracleResultAsset {
    request: string;
    responseCode: number;
    result: string;
}
