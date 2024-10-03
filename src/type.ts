type Output = {
    address:string,
    value:number
}

type Input = {
    txId:string,
    index:number
}

export type Transaction = {
    id:string,
    inputs:Input[],
    outputs:Output[]
}


export type Block = {
    id:string,
    height:number,
    transactions:Transaction[]
}

export type RequestRollback = {
    height:number
}

export type RequestBalance = {
    address:string
}

export type TransactionInfos = {
    [key:string]:string[] | number[]
}