import { Err, isErr, isOk, Ok, Result, RootError } from '@celo/base'
import { JsonFragment } from '@ethersproject/abi'
import { Provider } from '@ethersproject/abstract-provider'
import { JsonRpcProvider } from '@ethersproject/providers'
import { fetch } from 'cross-fetch'
import { NETWORKS } from './networks'
import proxyV1 from './static/proxy-v1'
import usdcProxy from './static/usdc-proxy'
import { Address, KnownProxy } from './types'

export enum FetchAbiErrorTypes {
  FetchAbiError = 'FetchAbiError',
  NoProxy = 'NoProxy',
  NotFound = 'NotFound',
}

export class FetchingAbiError extends RootError<FetchAbiErrorTypes.FetchAbiError> {
  constructor(error: Error) {
    super(FetchAbiErrorTypes.FetchAbiError)
    this.message = error.message
  }
}

export class NoProxyError extends RootError<FetchAbiErrorTypes.NoProxy> {
  constructor(error: Error) {
    super(FetchAbiErrorTypes.NoProxy)
    this.message = error.message
  }
}

export class NotFoundError extends RootError<FetchAbiErrorTypes.NotFound> {
  constructor(public readonly errors: FetchAbiError[]) {
    super(FetchAbiErrorTypes.NotFound)
    this.message = 'No ABIs could be found'
  }
}

export type FetchAbiError = FetchingAbiError | NoProxyError | NotFoundError

export interface AbiFetcher {
  fetchAbiForAddress: (address: Address) => Promise<Result<JsonFragment[], FetchAbiError>>
}


const fetchAsResult = async (input: RequestInfo) => {
  try {
    const res = await fetch(input)
    return Ok(res)
  } catch (error) {
    return Promise.resolve(Err(new FetchingAbiError(error as any)))
  }
}

export class SourcifyAbiFetcher implements AbiFetcher {
  constructor(public readonly chainId: number) {}
  async fetchAbiForAddress(address: Address): Promise<Result<JsonFragment[], FetchingAbiError>> {
    const requestResult = await fetchAsResult(
      `https://repo.sourcify.dev/contracts/full_match/${this.chainId}/${address}/metadata.json`
    )
    if (!requestResult.ok) {
      return requestResult
    }
    if (!requestResult.result.ok) {
      return Err(new FetchingAbiError(new Error('Could not fetch ABI')))
    }
    const data = await requestResult.result.json()
    const abi = data.output.abi
    return Ok(abi)
  }
}


export class ExplorerAbiFetcher implements AbiFetcher {
  constructor(public readonly baseUrl: string, public readonly apiKey?: string | undefined) {}
  async fetchAbiForAddress(address: Address): Promise<Result<JsonFragment[], FetchingAbiError>> {
    const apiKeyS = this.apiKey ? `&apikey=${this.apiKey}` : ''
    const requestResult = await fetchAsResult(
      `${this.baseUrl}/api?module=contract&action=getabi&address=${address}${apiKeyS}`
    )
    if (!requestResult.ok) {
      return requestResult
    }

    if (!requestResult.result.ok) {
      return Err(new FetchingAbiError(new Error('Could not fetch ABI. Status:' + requestResult.result.status)))
    }

    const data = await requestResult.result.json()
    if (data.status !== '1') {
      return Err(
        new FetchingAbiError(
          new Error(`Error from ${this.baseUrl}: ${data.result || data.message}`)
        )
      )
    }
    const abi = JSON.parse(data.result)
    return Ok(abi)
  }
}

export class ProxyAbiFetcher implements AbiFetcher {
  constructor(
    public readonly provider: Provider,
    public readonly abiFetchers: AbiFetcher[],
    public readonly knownProxies: KnownProxy[] = [proxyV1, usdcProxy]
  ) {}
  async fetchAbiForAddress(address: Address): Promise<Result<JsonFragment[], FetchAbiError>> {
    const contractCode = await this.provider.getCode(address)
    const contractCodeStripped = stripMetadataFromBytecode(contractCode)
    const matchingProxy = this.knownProxies.find(
      (_) => stripMetadataFromBytecode(_.bytecode) === contractCodeStripped
    )

    if (!matchingProxy) {
      return Err(new NoProxyError(new Error('Is not a proxy')))
    }

    const implementationAdress = await this.getImplementationAddress(matchingProxy, address)

    // Get ABI of Implementation
    const implementationABI = await getAbisFromFetchers(this.abiFetchers, implementationAdress)

    if (!implementationABI.ok) {
      return implementationABI
    }

    return Ok(implementationABI.result[0])
  }

  async getImplementationAddress(knownProxy: KnownProxy, address: Address) {
    const storageRead = await this.provider.getStorageAt(address, knownProxy.location)
    return '0x' + storageRead.substring(26)
  }
}

export const getAbisFromFetchers = async (abiFetchers: AbiFetcher[], address: Address) => {
  const abis = await Promise.all(abiFetchers.map((f) => f.fetchAbiForAddress(address)))
  const successFullAbis = abis.filter(isOk)
  if (successFullAbis.length > 0) {
    return Ok(successFullAbis.map((_) => _.result))
  } else {
    const failedAbis = abis.filter(isErr)
    return Err(new NotFoundError(failedAbis.map((_) => _.error)))
  }
}

interface GetAbiFetcherOptions {
  rpcUrls?: {[chainId: number] : string}
  explorerAPIKey?: string
  // Some explorers have an aggressive rate limit
  accomodateRateLimit?: boolean
}
export const getAbiFetchersForChainId = (chainId: number, opts?: GetAbiFetcherOptions) => {
  const sourcifyAbiFetcher = new SourcifyAbiFetcher(chainId)
  const network = NETWORKS[chainId]
  if (!network) {
    return [sourcifyAbiFetcher]
  }

  const explorerAbiFetcher = new ExplorerAbiFetcher(network.explorerAPIURL, opts?.explorerAPIKey)
  const rpcUrl = opts?.rpcUrls?.[chainId] || network.rpcURL;
  const provider = new JsonRpcProvider(rpcUrl)
  const proxyAbiFetcher = new ProxyAbiFetcher(provider, [sourcifyAbiFetcher, explorerAbiFetcher])
  if (opts?.accomodateRateLimit) {
    return [proxyAbiFetcher, sourcifyAbiFetcher]
  }
  return [proxyAbiFetcher, explorerAbiFetcher, sourcifyAbiFetcher]
}

const stripMetadataFromBytecode = (bytecode: string): string => {
  // Docs:
  // https://docs.soliditylang.org/en/develop/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode
  // Metadata format has changed once, but can be detected using last two bytes.
  switch (bytecode.substring(bytecode.length - 4)) {
    case '0029':
      // Format: 0xa1 0x65 'b' 'z' 'z' 'r' '0' 0x58 0x20 <32 bytes of swarm> 0x00 0x29
      return bytecode.substring(0, bytecode.length - 43 * 2)
    case '0032':
      // Format:
      // 0xa2 0x65 'b' 'z' 'z' 'r' '0' 0x58 0x20 <32 bytes of swarm>
      // 0x64 's' 'o' 'l' 'c' 0x43 <3 byte version encoding>
      // 0x00 0x32
      return bytecode.substring(0, bytecode.length - 52 * 2)
    default:
      return bytecode
  }
}
