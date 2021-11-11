import { ethers } from 'ethers'
import { getAbiFetchersForChainId, getAddressInfoFetchersForChainId } from '.'
import { Parser } from './parser'

async function main() {
  const celoAbiFetchers = getAbiFetchersForChainId(42220)
  const celoAddressInfoFetchers = getAddressInfoFetchersForChainId(42220)

  const parser = new Parser({ abiFetchers: celoAbiFetchers, addressInfoFetchers: celoAddressInfoFetchers })
  const provider = new ethers.providers.JsonRpcProvider('https://forno.celo.org')
  if (process.argv.length > 3) {
    const parseResult = await parser.parseAsResult({
      from: '',
      to: process.argv[2],
      data: process.argv[3],
      value: process.argv[4] || 0,
    })
    if (!parseResult.transactionDescription.ok) {
      console.log('Could not decode transaction')
      return
    }
    console.log(`To: ${parser.formatAddress(process.argv[2], parseResult.addressInfo)}`)
    console.log(parser.formatTxDescriptionToHuman(parseResult.transactionDescription.result, parseResult.addressInfo))
  } else {
    const txHash = process.argv[2]
    const tx = await provider.getTransaction(txHash)
    const parseResult = await parser.parseAsResult({
      from: tx.from,
      to: tx.to!,
      data: tx.data,
      value: tx.value,
    })
    if (!parseResult.transactionDescription.ok) {
      console.log('Could not decode transaction')
      return
    }
    console.log(parser.formatTxDescriptionToHuman(parseResult.transactionDescription.result, parseResult.addressInfo))
  }
}

main().catch(console.error)
