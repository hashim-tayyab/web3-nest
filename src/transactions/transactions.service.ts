import { Injectable, OnModuleInit } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Transaction, TransactionDocument } from './entities/transaction.entity';
import { Model } from 'mongoose';
import axios from 'axios';
import Web3 from 'web3';
import * as abi from '../abi/abi.json' ;


const providerUrl = `https://sepolia.infura.io/v3/d093ff853b9c44a4810cfca94435123a`;
// const privateKey = '59fb9e925770dd9464726fdcce16e7bb4ad13f1154b1d8e6c04be81d5272eaca';
const web3:Web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
const contractAddress = '0xcb6d971767d8598c584103ee66a416e604cbd565';
const MyContract:any = new web3.eth.Contract(abi, contractAddress);


@Injectable()
export class TransactionsService implements OnModuleInit{
  constructor(@InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>){}
  
  create(createTransactionDto: CreateTransactionDto) {
    const newTransaction = new this.transactionModel(createTransactionDto);
    return newTransaction.save();
  }

  onModuleInit() {
    console.log("Listening")
    this.listenToEvents();
  }

  private async listenToEvents() {
    const eventName = 'Mint';

    // Listening for past events
    const x = await MyContract.getPastEvents(eventName, {
      fromBlock: 0, // Adjust to the appropriate block number
      toBlock: 'latest'
    })
    console.log(x)
    //   {
    //   fromBlock: 0, // Adjust to the appropriate block number
    //   toBlock: 'latest'
    // }, 
    // (error:any, events:any) => {
    //   // if (!error) {
    //     console.log('Past events:', events);
    //   // } else {
    //     console.error('Error fetching past events:', error);
    //   // }
    // });

    // Listening for new events
    // MyContract.events[eventName]({
    //   fromBlock: 'latest'
    // })
    // .on('data', (event) => {
    //   console.log('New event:', event);
    // })
  }


  async verifyTransactionAndMint(txhash: string) {
    // const action = 'eth_getTransactionByHash';
    // const module = 'proxy'
    // const url = `https://api-sepolia.etherscan.io/api?module=${module}&action=${action}&txhash=${txhash}&apikey=${process.env.ETHERSCAN_API_KEY}`;
    // const privateKey = '0x59fb9e925770dd9464726fdcce16e7bb4ad13f1154b1d8e6c04be81d5272eaca'
    const minterAccount = web3.eth.accounts.privateKeyToAccount(process.env.WALLET_PRIVATE_KEY)

    try {
    //   const response = await axios.get(url);
    //   if (!response || !response.data || !response.data.result) {
    //     return 'Unable to fetch transaction data';
    //   }
    //   const { to, from, value } = response.data.result;

      // Calculate amount of tokens to be transferred
      const to = '0xfFc3619e8e287AD6BD7F5129d690856436380855';
      const from = '0xb42d3ac85E7188316eb7f145AaDDE716a7a8553A';
      const value = 1;
      const numOfTokens = this.countReward(to, from, value);

      // Call the add txHash to WhiteList function in smart contract
      // return await MyContract.methods.balanceOf('0xb42d3ac85E7188316eb7f145AaDDE716a7a8553A').call();
      
      const signedTx = await web3.eth.accounts.signTransaction({
        gas: 100000, // adjust gas limit as needed
        to: contractAddress, // replace with actual contract function call
        gasPrice: await web3.eth.getGasPrice(),
        data: MyContract.methods.addTxHashToWhitelist(txhash).encodeABI(), // function call data
        nonce: await web3.eth.getTransactionCount(minterAccount.address),
      }, process.env.WALLET_PRIVATE_KEY);


      const createReceipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
      );
      console.log(`Transaction successful with hash: ${createReceipt.transactionHash}`);

      // Mint tokens after transaction added to whitelist
      const signMintTx = await web3.eth.accounts.signTransaction({
        gas: 200000, // adjust gas limit as needed
        to: contractAddress, // replace with actual contract function call
        gasPrice: await web3.eth.getGasPrice(),
        data: MyContract.methods.mint(from, 10, txhash).encodeABI(), // function call data
        nonce: await web3.eth.getTransactionCount(minterAccount.address),
      }, process.env.WALLET_PRIVATE_KEY);
      await web3.eth.sendSignedTransaction(signMintTx.rawTransaction);

      return `${numOfTokens} Tokens added to ${to}'s Account`;

    } catch (error) {
      return `Error: ${error.message}`;
    }

  }

  countReward(to:string, from:string, value:any){
    const eth = value/10**18;
     const tokens = 10
    return tokens ;
  }

  findAll() {
    return this.transactionModel.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} transaction`;
  }

  async findBySenderAddress(sender: string){
    const transactionBySender = await this.transactionModel.findOne({
        from: sender
    });
    return transactionBySender;
  }

  update(id: number, updateTransactionDto: UpdateTransactionDto) {
    return `This action updates a #${id} transaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} transaction`;
  }
}
