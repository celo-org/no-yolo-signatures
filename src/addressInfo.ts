import { Address, Transaction, TokenList, GenericAddressList } from "./types";
import { NETWORKS } from ".";
export enum AddressInfoType {
  TokenListInfo = 'tokenListInfo',
  GenericAddressInfo = 'genericAddressInfo',
  ContextInfo = 'contextInfo'
}

export enum ContextInfoType {
  MsgSender = 'msgSender'
}

interface TokenAddressInfo {
  type: AddressInfoType.TokenListInfo
  chainId: number,
  symbol: string,
  address: Address,
  name: string,
  logoURI: string
}

interface GenericAddressInfo {
  type: AddressInfoType.GenericAddressInfo
  chainId: number,
  address: Address,
  name: string,
  description: string,
  logoURI: string
}

interface ContextAddressInfo {
  type: AddressInfoType.ContextInfo,
  contextType: ContextInfoType
}


export type AddressInfo = TokenAddressInfo | GenericAddressInfo | ContextAddressInfo
export type AddressFetchResult = { [key: Address]: Array<AddressInfo> }
interface AddressInfoFetchContext {
  tx: Transaction
}
export interface AddressInfoFetcher {
  fetchInfo: (address: Address, context: AddressInfoFetchContext) => Promise<Array<AddressInfo>>
}



export class TokenListAddressInfoFetcher implements AddressInfoFetcher {
  constructor(public readonly tokenList: TokenList) { }
  fetchInfo(address: Address): Promise<Array<AddressInfo>> {
    const match = this.tokenList.tokens.find(_ => _.address === address)
    if (!match) {
      return Promise.resolve([])
    }

    return Promise.resolve([{
      type: AddressInfoType.TokenListInfo,
      ...match
    }])
  }
}

export class GenericAddressListInfoFetcher implements AddressInfoFetcher {
  constructor(public readonly addressList: GenericAddressList) { }
  fetchInfo(address: Address): Promise<Array<AddressInfo>> {
    const match = this.addressList.addresses.find(_ => _.address === address)
    if (!match) {
      return Promise.resolve([])
    }

    return Promise.resolve([{
      type: AddressInfoType.GenericAddressInfo,
      ...match
    }])
  }
}

export class ContextAddressInfoFetcher implements AddressInfoFetcher {
  fetchInfo(address: Address, context: AddressInfoFetchContext): Promise<ContextAddressInfo[]> {
    if (address === context.tx.from) {
      return Promise.resolve([{
        type: AddressInfoType.ContextInfo,
        contextType: ContextInfoType.MsgSender
      }])
    }
    return Promise.resolve([])
  }
}

export const getAddressInfoFetchersForChainId = (chainId: number) => {
  const contextFetcher = new ContextAddressInfoFetcher()
  const network = NETWORKS[chainId]
  if (!network) {
    return [contextFetcher]
  }
  return [
    network.genericAddressList ? [new GenericAddressListInfoFetcher(network.genericAddressList)] : [],
    network.tokenList ? [new TokenListAddressInfoFetcher(network.tokenList)] : [],
    [contextFetcher]
  ].flat()

}
