import { ethers } from 'ethers'
import { celoAbiFetchers } from './abiFetcher'
import { Parser } from './parser'

async function main() {
  const parser = new Parser({ abiFetchers: celoAbiFetchers })
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
    console.log(parser.formatTxDescriptionToHuman(parseResult.transactionDescription.result))
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
    console.log(parser.formatTxDescriptionToHuman(parseResult.transactionDescription.result))
  }
}

main().catch(console.error)
