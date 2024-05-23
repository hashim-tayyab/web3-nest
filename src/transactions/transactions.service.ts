import { Injectable, OnModuleInit } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Transaction, TransactionDocument } from './entities/transaction.entity';
import { Model } from 'mongoose';
import axios from 'axios';
import Web3 from 'web3';
import * as abi from '../abi/abi.json' ;
import * as USDT_ABI from '../abi/usdtabi/usdtabi.json';


const providerSepoliaUrl = `https://sepolia.infura.io/v3/d093ff853b9c44a4810cfca94435123a`;
const providedEthereumUrl = 'https://mainnet.infura.io/v3/d093ff853b9c44a4810cfca94435123a'

const sepoliaweb3:Web3 = new Web3(new Web3.providers.HttpProvider(providerSepoliaUrl));

const web3:Web3 = new Web3(new Web3.providers.HttpProvider(providedEthereumUrl));


const providedWebsocketUrl = 'wss://mainnet.infura.io/ws/v3/d093ff853b9c44a4810cfca94435123a';
const socketweb3 = new Web3(new Web3.providers.WebsocketProvider(providedWebsocketUrl));

//MY ERC20 Contract
const contractAddress = '0x2155B6d75fa373a741e01f07507605FD07851f7D'
const MyContract:any = new web3.eth.Contract(abi, contractAddress);


// USDT ERC20 Contract
const USDTContractAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const USDT = new web3.eth.Contract(USDT_ABI, USDTContractAddress);


@Injectable()
export class TransactionsService implements OnModuleInit{
  private intervalId: NodeJS.Timeout;
  constructor(@InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>){ }
  
  create(createTransactionDto: CreateTransactionDto) {
    const newTransaction = new this.transactionModel(createTransactionDto);
    return newTransaction.save();
  }

  onModuleInit = async () => {
    this.listenToUsdtTransferEvents();
  }



  private async listenToUsdtTransferEvents() {
    const filter = {
      // fromBlock: 'latest',
      fromBlock: 19930807,
      // toBlock: 'latest',
      filter: {
        to:'0xe6d4f82239ab9a2d3cfcC185FB4753899880CB74',
      }
    };
    USDT.events.Transfer(filter).on('data', (event) => {
      console.log("\nUSDT Transfer Event:");
      console.log("  From:", event.returnValues.from);
      console.log("  To:", event.returnValues.to);
      console.log("  Amount:", Number(event.returnValues.value));
      console.log("  Block Number:", Number(event.blockNumber));

      console.log("  Transaction Hash:", event.transactionHash);

      this.verifyTransactionAndMint(event.transactionHash);
    })
    
  }

  async getBalance(address: string){
// const walletAddress = '0x79672062c5a45E3808D6B784129Cf3eCF59d4224'
    try {
    const res = await USDT.methods.balanceOf(address).call();
    console.log('USDT:',res);
      const readableBalance = web3.utils.fromWei(Number(res)*10**12, 'ether');
      console.log("Readable Balance:", readableBalance, "USDT");
    } catch (error) {
      console.log(error)
    }
  }



  async verifyTransactionAndMint(txhash: string) {
    const action = 'eth_getTransactionByHash';
    const module = 'proxy'
    // const url = `https://api-sepolia.etherscan.io/api?module=${module}&action=${action}&txhash=${txhash}&apikey=${process.env.ETHERSCAN_API_KEY}`;

    const transferUrl = `https://api.etherscan.io/api?module=account&action=tokentx&address=0xe6d4f82239ab9a2d3cfcC185FB4753899880CB74&startblock=19930807&sort=asc&apikey=${process.env.ETHERSCAN_API_KEY}`

    const url = `https://api.etherscan.io/api?module=${module}&action=${action}&txhash=${txhash}&apikey=${process.env.ETHERSCAN_API_KEY}`;
    const minterAccount = sepoliaweb3.eth.accounts.privateKeyToAccount(process.env.WALLET_PRIVATE_KEY)

    try {
      const response = await axios.get(transferUrl);
      if (!response || !response.data || !response.data.result) {
        return 'Unable to fetch transaction data';
      }
      // const { _to, _from, value } = response.data.result;
      const _value = response.data.result[0].value
      console.log("Value of USDT",response.data.result[0].value)
      // return value;

      const to = '0xfFc3619e8e287AD6BD7F5129d690856436380855';
      const from = '0xb42d3ac85E7188316eb7f145AaDDE716a7a8553A';
      // const value = 1; //This value is in ethers 
      

      // Call the add txHash to WhiteList function in smart contract
      // return await MyContract.methods.balanceOf('0xb42d3ac85E7188316eb7f145AaDDE716a7a8553A').call();
      
      const signedTx = await sepoliaweb3.eth.accounts.signTransaction({
        gas: 100000, // adjust gas limit as needed
        to: contractAddress, // replace with actual contract function call
        gasPrice: await sepoliaweb3.eth.getGasPrice(),
        data: MyContract.methods.addTxHashToWhitelist(txhash).encodeABI(), // function call data
        nonce: await sepoliaweb3.eth.getTransactionCount(minterAccount.address),
      }, process.env.WALLET_PRIVATE_KEY);
      const createReceipt = await sepoliaweb3.eth.sendSignedTransaction(signedTx.rawTransaction);
      console.log(`Transaction added to whitelist : ${createReceipt.transactionHash}`);

      // const numOfTokens = this.countReward(to, from, value);

      // Mint tokens after transaction added to whitelist
      const signMintTx = await sepoliaweb3.eth.accounts.signTransaction({
        gas: 200000, // adjust gas limit as needed
        to: contractAddress, // replace with actual contract function call
        gasPrice: await sepoliaweb3.eth.getGasPrice(),

        data: MyContract.methods.mint(from, _value, txhash).encodeABI(), // function call data
        nonce: await sepoliaweb3.eth.getTransactionCount(minterAccount.address),
      }, process.env.WALLET_PRIVATE_KEY);
      await sepoliaweb3.eth.sendSignedTransaction(signMintTx.rawTransaction);
      console.log(`$Tokens added to ${from}'s Account`)
      return;

    } catch (error) {
      return `Error: ${error.message}`;
    }

  }

  // countReward(to:string, from:string, value:any){
  //   // suppose 1 eth = 100 tokens
  //   const eth = value/10**18;
  //    const tokens = 10
  //    const numOfTokens = (eth*100);
  //    let reward = 0
  //    if(numOfTokens>0 && numOfTokens <= 300){
  //      reward = 0;
  //    }
  //    if(numOfTokens>300 && numOfTokens <= 500){
  //      reward = numOfTokens * 0.005;
  //    }
  //    else if (numOfTokens>500 && numOfTokens <= 1000){
  //      reward = numOfTokens * 0.01
  //    }
  //    else if(numOfTokens>1000 && numOfTokens <= 3000){
  //      reward = numOfTokens * 0.02
  //   }
  //   return tokens + reward;
  // }

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
