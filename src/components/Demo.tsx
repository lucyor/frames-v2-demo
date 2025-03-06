// src/lib/wagmi-core-setup.ts
import { createConfig, http, Connector, ConnectParameters, disconnect } from '@wagmi/core'
import { base } from '@wagmi/core/chains'
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { connect } from '@wagmi/core'
import { injected } from '@wagmi/connectors'
import { getAccount } from '@wagmi/core'
import { signMessage } from '@wagmi/core'
import { writeContract } from '@wagmi/core'
const abi = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'transferFrom',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'sender', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const
// 1. 配置核心实例
const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    farcasterFrame()
  ],
});


import { useEffect, useState } from 'react'

export default function Demo(
  { title }: { title?: string } = { title: "Frames v2 Demo" }
)  {
  const [account, setAccount] = useState<string>()
  const [txHash, setTxHash] = useState<string>()
  console.log(`title`,title)
  // 初始化连接器
  useEffect(() => {
    const init = async () => {
      try {
        const res = await connect(config, { connector: injected() })
        console.log( `connect res`,res )
        const account = getAccount(config)
        console.log(`get Account`,account)
        setAccount(account.address)
      } catch (error) {
        console.error('Connection failed:', error)
      }
    }

    init()
    return () => {
     
    }
  }, [])

  const handleSendTx = async () => {
    try {
      const result = await writeContract(config, {
        abi,
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        functionName: 'transferFrom',
        args: [
          '0xd2135CfB216b74109775236E36d4b433F1DF507B',
          '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
          123n,
        ],
      })
      console.log(`tsx result`,result)
      setTxHash(result)
    } catch (error) {
      console.error('Transaction failed:', error)
    }
  }
  const handleSignMessage = async ()=>{
    try{
      await signMessage(config, { message: 'hello world' })
    }catch(error){

    }
  }

  return (
    <div>
      <p>Connected Account: {account}</p>
      <button onClick={handleSendTx}>
        Send Transaction
      </button>
      <button onClick={handleSignMessage}>
        Sign Message
      </button>
      {txHash && <p>Tx Hash: {txHash}</p>}
    </div>
  )
}