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
export interface TokenList {
  tokens: Array<{
    chainId: number,
    symbol: string,
    address: Address,
    name: string,
    logoURI: string
  }>
}
export interface GenericAddressList {
  addresses: Array<{
    chainId: number,
    address: Address,
    name: string,
    description: string,
    logoURI: string
  }>
}