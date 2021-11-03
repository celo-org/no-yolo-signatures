# No-Yolo-Signatures

One of the key characteristics of decentralized networks that have come since the Bitcoin whitepaper is the use of non-custodial cryptographic keys to authenticate user intent. However, more often than not, users cannot/do not understand the implications of what their keys are signing. Often, the only information available to the users are the to contract as well as the raw data bytes. This package is trying to provide tooling to make transaction signatures more transparenct and secure. It started from a Celo Improvement Protocol (https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0049.md)

## Installation

Note: This should be considered a prototype for now and the API is likely to change.

```sh
yarn add no-yolo-signatures
```

### Usage:

`no-yolo-signatures` uses a basic typescript implementation of the Result type to express possible failures in computation. To use, you will want to create an instance of the parser with the relevant ABIFetchers and AddressInfoFetchers and then call `parseAsResult`:

```typescript
const parser = new Parser({ abiFetchers: celoAbiFetchers, addressInfoFetchers: celoAddressInfoFetchers })
const parseResult = await parser.parseAsResult({
  from: tx.from,
  to: tx.to,
  data: tx.data,
  value: tx.value,
})

type AddressFetchResult = { [key: Address]: Array<AddressInfo> }
interface ParserResult {
  transactionDescription: Result<TransactionDescription, ParserErrors>,
  addressInfo: AddressFetchResult
}
```

## Features

### ABI Fetching

`no-yolo-signatures` attempts to find the relevant ABI(s) for your transaction from sources like [Sourcify](https://sourcify.dev) or block explorers like [Etherscan](https://etherscan.io) or [Blockscout](https://blockscout.com). It also has built-in support for getting the implementation contract ABI when it detects the target to be a known proxy. 

Consumers of the library can specify which ABI fetchers they would like to use and parameterize them. For example, for Celo Mainnet, you'd like want to use something like this:

```typescript
const celoSourcifyAbiFetcher = new SourcifyAbiFetcher(42220)
const celoBlockscoutAbiFetcher = new ExplorerAbiFetcher('https://explorer.celo.org')
const celoProvider = new JsonRpcProvider('https://forno.celo.org')
const proxyAbiFetcher = new ProxyAbiFetcher(celoProvider, [
  celoSourcifyAbiFetcher,
  celoBlockscoutAbiFetcher,
])
export const celoAbiFetchers = [proxyAbiFetcher, celoSourcifyAbiFetcher, celoBlockscoutAbiFetcher]

const parser = new Parser({ abiFetchers: celoAbiFetchers, addressInfoFetchers: celoAddressInfoFetchers })
```

The result of the parsing is effectively an [`ethers.js` `TransactionDescription`](https://docs.ethers.io/v5/api/utils/abi/interface/#TransactionDescription) which can be then displayed to the user.

### Address Info

While transaction decoding via an ABI increases transparency, very few people are actually able to read smart contract source code. In practice, many folks rely on "weak subjectivity" on contract addresses, i.e. they paste the address in a block explorer and determine whether it presents some kind of canonical identity with social consensus in usage or beyond. `no-yolo-signatures` can mechanize that natural user behavior by leveraging trusted sources, such as [Token Lists](https://tokenlists.org/) or generic address lists (which effectively act similar to [Etherscan's address tags](https://info.etherscan.com/address-tag-note/)).

The result of the parsing is a dictionary where the key is the address and the value is an array of `AddressInfo` objects. It is recommended to leverage this info in displaying addresses involved in the `TransactionDescription` above.


## Example

```sh
 yarn parse 0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121 0x38ed17390000000000000000000000000000000000000000000000000029091656feba7d000000000000000000000000000000000000000000000000001d90acc863151800000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000289769b63e4727616c340989e396fe69ab42ed930000000000000000000000000000000000000000000000000000000061803d75000000000000000000000000000000000000000000000000000000000000000400000000000000000000000017700282592d6917f6a73d0bf8accf4d578c131e000000000000000000000000471ece3750da237f93b8e339c536989b8978a43800000000000000000000000000400fcbf0816bebb94654259de7273f4a05c762000000000000000000000000765de816845861e75a25fca122bb6898b8b1282a
To: Ubeswap Router
swapExactTokensForTokens(amountIn: 11550465598601853, amountOutMin: 8321846095320344, path: ["Token: Moola (MOO)", "Token: Celo (CELO)", "Token: Poof (POOF)", "Token: Celo Dollar (cUSD)"], to: "0x289769b63e4727616C340989E396fE69ab42Ed93", deadline: 1635794293)
```