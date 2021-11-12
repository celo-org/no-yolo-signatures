import { BigNumberish } from 'ethers'

export type Address = string
export type BytesAsString = string
export interface KnownProxy {
  bytecode: string
  location: Address
}
export interface Transaction {
  from: Address
  to: Address
  data: BytesAsString
  value: BigNumberish
}
export interface TokenListEntry {
  chainId: number,
  symbol: string,
  address: Address,
  name: string,
  logoURI: string
}
export interface TokenList {
  tokens: TokenListEntry[]
}
export interface GenericAddressListEntry {
  chainId: number,
  address: Address,
  name: string,
  description: string,
  logoURI: string
}
export interface GenericAddressList {
  addresses: GenericAddressListEntry[]
}