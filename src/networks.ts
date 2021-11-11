import { GenericAddressList, TokenList } from ".";
import CeloTokenList from "./static/celoTokenList.json";
import EthTokenList from "./static/ethTokenList.json";
import CeloGenericAddressList from "./static/celoGenericAddressList.json";

export const NETWORKS: { [chainId: number]: {
  name: string,
  chainId: number,
  explorerURL: string,
  explorerAPIURL: string,
  rpcURL: string,
  genericAddressList?: GenericAddressList,
  tokenList?: TokenList
}} = {
  1: {
    name: "Ethereum Mainnet",
    chainId: 1,
    explorerURL: "https://etherscan.io",
    explorerAPIURL: "https://api.etherscan.io",
    rpcURL: "https://mainnet-nethermind.blockscout.com/",
    tokenList: EthTokenList
  },
  42220: {
    name: "Celo Mainnet",
    chainId: 42220,
    explorerURL: "https://explorer.celo.org",
    explorerAPIURL: "https://explorer.celo.org",
    rpcURL: "https://forno.celo.org",
    genericAddressList: CeloGenericAddressList,
    tokenList: CeloTokenList
  },
  137: {
    name: "Polygon Mainnet",
    chainId: 137,
    explorerURL: "https://polygonscan.com",
    explorerAPIURL: "https://api.polygonscan.com",
    rpcURL: "https://polygon-rpc.com"
  }
}