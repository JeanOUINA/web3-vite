export class ProviderError extends Error {
    name = "ProviderError"
}

export class ViteError extends Error {
    name = "ViteError"
    code = 0
    constructor(errorObj:{
        error: {
            code: number,
            message: string
        }
    }){
        super(`${errorObj.error?.code} ${errorObj.error?.message}`)
        this.code = errorObj.error?.code
    }
}

export class ViteRequestError extends Error {
    name = "ViteRequestError"
}