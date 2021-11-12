export const NETWORKS: { [chainId: number]: {
  name: string,
  chainId: number,
  explorerURL: string,
  explorerAPIURL: string,
  explorerName: string,
  rpcURL: string,
  genericAddressListUrl?: string,
  tokenListUrl?: string
}} = {
  1: {
    name: "Ethereum Mainnet",
    chainId: 1,
    explorerURL: "https://etherscan.io",
    explorerAPIURL: "https://api.etherscan.io",
    explorerName: "Etherscan",
    rpcURL: "https://mainnet-nethermind.blockscout.com/",
    tokenListUrl: "https://gateway.ipfs.io/ipns/tokens.uniswap.org",
  },
  42220: {
    name: "Celo Mainnet",
    chainId: 42220,
    explorerURL: "https://explorer.celo.org",
    explorerAPIURL: "https://explorer.celo.org",
    explorerName: "Celo Explorer",
    rpcURL: "https://forno.celo.org",
    genericAddressListUrl: "https://raw.githubusercontent.com/celo-org/no-yolo-signatures/main/src/static/celoGenericAddressList.json",
    tokenListUrl: "https://raw.githubusercontent.com/celo-org/no-yolo-signatures/main/src/static/celoTokenList.json"
  },
  137: {
    name: "Polygon Mainnet",
    chainId: 137,
    explorerName: "Polygonscan",
    explorerURL: "https://polygonscan.com",
    explorerAPIURL: "https://api.polygonscan.com",
    rpcURL: "https://polygon-rpc.com"
  }
}