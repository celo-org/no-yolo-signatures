import { Address, Transaction, TokenList, GenericAddressList } from "./types";
import { NETWORKS } from ".";
import fetch from "cross-fetch";
export enum AddressInfoType {
  TokenListInfo = 'tokenListInfo',
  GenericAddressInfo = 'genericAddressInfo',
  ContextInfo = 'contextInfo',
  GenericWarningInfo = 'genericWarningInfo'
}

export enum ContextInfoType {
  MsgSender = 'msgSender'
}

export interface TokenAddressInfo {
  type: AddressInfoType.TokenListInfo
  chainId: number,
  symbol: string,
  address: Address,
  name: string,
  logoURI: string
  source: string
}

export interface GenericAddressInfo {
  type: AddressInfoType.GenericAddressInfo
  chainId: number,
  address: Address,
  name: string,
  description: string,
  logoURI: string
  source: string
}

export interface GenericWarningInfo {
  type: AddressInfoType.GenericWarningInfo
  chainId: number,
  address: Address,
  name: string,
  description: string,
  logoURI: string
  source: string
}

interface ContextAddressInfo {
  type: AddressInfoType.ContextInfo,
  contextType: ContextInfoType
}


export type AddressInfo = TokenAddressInfo | GenericAddressInfo | ContextAddressInfo | GenericWarningInfo
export type AddressFetchResult = { [key: Address]: Array<AddressInfo> }
interface AddressInfoFetchContext {
  tx: Transaction
}
export interface AddressInfoFetcher {
  fetchInfo: (address: Address, context: AddressInfoFetchContext) => Promise<Array<AddressInfo>>
}

export enum BuiltInAddressInfoFetchersType {
  TokenList = 'TokenList',
  GenericAddressList = 'GenericAddressList',
  GenericWarningList = 'GenericWarningList',
  Context = 'Context'
}

export type BuiltInAddressInfoFetcher = TokenListAddressInfoFetcher | GenericAddressListInfoFetcher | ContextAddressInfoFetcher | GenericWarningListInfoFetcher



export class TokenListAddressInfoFetcher implements AddressInfoFetcher {
  public readonly type = BuiltInAddressInfoFetchersType.TokenList
  static async fromURL(url: string) {
    const resp = await fetch(url)
    const json = await resp.json()
    return new this(json, url)
  }
  constructor(public readonly tokenList: TokenList, public readonly source: string) { }
  fetchInfo(address: Address): Promise<Array<AddressInfo>> {
    const match = this.tokenList.tokens.find(_ => _.address === address)
    if (!match) {
      return Promise.resolve([])
    }

    return Promise.resolve([{
      type: AddressInfoType.TokenListInfo,
      ...match,
      source: this.source
    }])
  }
}

export class GenericAddressListInfoFetcher implements AddressInfoFetcher {
  public readonly type = BuiltInAddressInfoFetchersType.GenericAddressList
  static async fromURL(url: string) {
    const resp = await fetch(url)
    const json = await resp.json()
    return new this(json, url)
  }
  constructor(public readonly addressList: GenericAddressList, public readonly source: string) { }
  fetchInfo(address: Address): Promise<Array<AddressInfo>> {
    const match = this.addressList.addresses.find(_ => _.address === address)
    if (!match) {
      return Promise.resolve([])
    }

    return Promise.resolve([{
      type: AddressInfoType.GenericAddressInfo,
      ...match,
      source: this.source
    }])
  }
}

export class GenericWarningListInfoFetcher implements AddressInfoFetcher {
  public readonly type = BuiltInAddressInfoFetchersType.GenericWarningList
  static async fromURL(url: string) {
    const resp = await fetch(url)
    const json = await resp.json()
    return new this(json, url)
  }
  constructor(public readonly addressList: GenericAddressList, public readonly source: string) { }
  fetchInfo(address: Address): Promise<Array<AddressInfo>> {
    const match = this.addressList.addresses.find(_ => _.address === address)
    if (!match) {
      return Promise.resolve([])
    }

    return Promise.resolve([{
      type: AddressInfoType.GenericWarningInfo,
      ...match,
      source: this.source
    }])
  }
}


export class ContextAddressInfoFetcher implements AddressInfoFetcher {
  public readonly type = BuiltInAddressInfoFetchersType.Context
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

export const getAddressInfoFetchersForChainId = async (chainId: number) => {
  const contextFetcher = new ContextAddressInfoFetcher()
  const network = NETWORKS[chainId]
  if (!network) {
    return [contextFetcher]
  }
  return [
    network.genericAddressListUrl ? [await GenericAddressListInfoFetcher.fromURL(network.genericAddressListUrl)] : [],
    network.tokenListUrl ? [await TokenListAddressInfoFetcher.fromURL(network.tokenListUrl)] : [],
    [contextFetcher]
  ].flat()

}
