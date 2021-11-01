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