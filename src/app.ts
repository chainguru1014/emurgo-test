import Fastify from 'fastify';
import { randomUUID,createHash } from 'crypto';
import { getDataBase } from './database';
import type { Block, RequestBalance, RequestRollback, Transaction, TransactionInfos } from './type';

function sha256(input:string) {
  return createHash('sha256').update(input).digest('hex');
}

const fastify = Fastify({ logger: true });

fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});

fastify.post<{Body:Block[]}>('/blocks',async(req,res)=>{
  const blocks = req.body
  try {
    const pool = getDataBase()

    const {rows} = await pool.query('Select * from blocks order by height');

    let transactionInfos:TransactionInfos = {}

    

    if(rows.length === 0 && blocks[0].height !== 1) {
      return res.code(400).send({error:'First height must be 1'})
    }

    for(const block of blocks) {
      let value = block.height.toString();
      for(const transaction of block.transactions) {
        value += transaction.id
        if(!transactionInfos[transaction.id]) {
          transactionInfos[transaction.id] = []
        }
        for(const item in transaction.outputs) {
          transactionInfos[transaction.id][item] = transaction.outputs[item].value
        }
      }

      if(block.id !== sha256(value)) {
        return res.code(400).send({error:'Block id is not correct'})
      }
    }

    let input_balance = 0;

    for(const block of blocks) {
      for(const transaction of block.transactions) {
        for(const input of transaction.inputs) {
          if(transactionInfos[input.txId][input.index]) {
            input_balance += Number(transactionInfos[input.txId][input.index]);
          } 
        }
      }
    }

    let output_balance = 0;
    for(const block of blocks) {
      for(const transaction of block.transactions) {
        for(const output of transaction.outputs) {
          output_balance += output.value
        }
      }
    }

    if(input_balance !== output_balance) {
      return res.code(400).send({error:'Input Balance is not equal to output balance'})
    }



    for(const block of blocks) {
      const id = randomUUID()
      await pool.query(`
        INSERT INTO blocks(id,height,transactions) VALUES($1, $2, $3);
      `,[id,block.height,JSON.stringify(block.transactions)])
    }
  
    return {status: 'success'}
  }
  catch(err) {
    return {status:'failed',message:err}
  }
 
})

fastify.post<{Querystring:RequestRollback}>('/rollback',{
  schema:{
    querystring:{
      type:'object',
      required:['height'],
      properties:{
        height:{
          type:'number',minimum:1
        }
      }
    }
  }
},async(req,res) => {
  try {
    const height = req.query.height

    const pool = getDataBase()

    await pool.query(`DELETE from blocks where height > $1;`,[height])

    return {status:'success'}
  }
  catch(err) {
    return {status:'failed',message:err}
  }
})

fastify.get<{Params:RequestBalance}>('/balance/:address',{
  schema:{
    params:{
      type:'object',
      required:['address'],
      properties:{
        address:{
          type:'string'
        }
      }
    }
  }
},async(req,res)=>{
    try {
      const address = req.params.address
      const pool = getDataBase()
      const {rows:blocks} = await pool.query(`Select * from blocks Order by height;`);

      
      let balance = 0;
      let transactionInfos:TransactionInfos = {}

      for(const block of blocks) {
        let transactions:Transaction[] = JSON.parse(block.transactions)

        for(const transaction of transactions) {
          if(!transactionInfos[transaction.id]) {
            transactionInfos[transaction.id] = []
          }
          for(const item in transaction.outputs) {
            transactionInfos[transaction.id][item] = transaction.outputs[item].address
          }
        }
      }
      
      for(const block of blocks) {
        let transactions:Transaction[] = JSON.parse(block.transactions)
        for(const transaction of transactions) {
          let sent = false;
          if(transaction.inputs.length > 0) {
            if(transactionInfos[transaction.inputs[0].txId] && transactionInfos[transaction.inputs[0].txId][transaction.inputs[0].index] == address){
              for(const output of transaction.outputs) {
                if(output.address !== address) {
                  balance -= output.value 
                  sent = true;
                }
              }
            }
          }

          for(const output of transaction.outputs) {
            if(output.address === address) {
              balance += output.value
            }
          }
        }
      } 

      return {status:'success',balance}
    }
    catch(err) {
      return {status:'failed',message:err}
    }
})

export default fastify;