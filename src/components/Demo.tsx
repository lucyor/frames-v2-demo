// src/lib/wagmi-core-setup.ts
import { createConfig, http, Connector, ConnectParameters, disconnect, simulateContract } from '@wagmi/core'
import { base } from '@wagmi/core/chains'
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { connect } from '@wagmi/core'
import { injected } from '@wagmi/connectors'
import { getAccount } from '@wagmi/core'
import { signMessage } from '@wagmi/core'
import { writeContract } from '@wagmi/core'
import VConsole from 'vconsole'
import { createStore } from "mipd";
import sdk, {
  AddFrame,
  FrameNotificationDetails,
  SignIn as SignInCore,
  type Context,
} from "@farcaster/frame-sdk";

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
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [added, setAdded] = useState(false);
  const [lastEvent, setLastEvent] = useState("");
  const [notificationDetails, setNotificationDetails] =
    useState<FrameNotificationDetails | null>(null);
  console.log(`title`,title)
  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);
      setAdded(context.client.added);

      sdk.on("frameAdded", ({ notificationDetails }) => {
        setLastEvent(
          `frameAdded${!!notificationDetails ? ", notifications enabled" : ""}`
        );

        setAdded(true);
        if (notificationDetails) {
          setNotificationDetails(notificationDetails);
        }
      });

      sdk.on("frameAddRejected", ({ reason }) => {
        setLastEvent(`frameAddRejected, reason ${reason}`);
      });

      sdk.on("frameRemoved", () => {
        setLastEvent("frameRemoved");
        setAdded(false);
        setNotificationDetails(null);
      });

      sdk.on("notificationsEnabled", ({ notificationDetails }) => {
        setLastEvent("notificationsEnabled");
        setNotificationDetails(notificationDetails);
      });
      sdk.on("notificationsDisabled", () => {
        setLastEvent("notificationsDisabled");
        setNotificationDetails(null);
      });

      sdk.on("primaryButtonClicked", () => {
        console.log("primaryButtonClicked");
      });

      console.log("Calling ready");
      sdk.actions.ready({});

      // Set up a MIPD Store, and request Providers.
      const store = createStore();

      // Subscribe to the MIPD Store.
      store.subscribe((providerDetails) => {
        console.log("PROVIDER DETAILS", providerDetails);
        // => [EIP6963ProviderDetail, EIP6963ProviderDetail, ...]
      });
    };
    if (sdk && !isSDKLoaded) {
      console.log("Calling load");
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);



  // 初始化连接器
  const init = async () => {
    try {
      console.log(`init`)
      const res = await connect(config, { connector: config.connectors[0] })
      console.log(`connect res`, res)
      const account = getAccount(config)
      console.log(`get Account`, account)
      setAccount(account.address)
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }
  useEffect(() => {
    const vConsole = new VConsole()
    return () => {
      vConsole.destroy()
    }
  }, [])
  const handleSendTx = async () => {
    try {
      console.log(`handleSendTx`)
      const { connector } = getAccount(config)
      const { request } = await simulateContract(config, {
        abi,
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        functionName: 'transferFrom',
        args: [
          '0xd2135CfB216b74109775236E36d4b433F1DF507B',
          '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
          123n,
        ],
        connector
      })
      const result = await writeContract(config, request)
      // const result = await writeContract(config, {
      //   abi,
      //   address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      //   functionName: 'transferFrom',
      //   args: [
      //     '0xd2135CfB216b74109775236E36d4b433F1DF507B',
      //     '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
      //     123n,
      //   ],
      // })
      console.log(`tsx result`,result)
      setTxHash(result)
    } catch (error) {
      console.error('Transaction failed:', error)
    }
  }
  const handleSignMessage = async ()=>{
    try{
      console.log(`handleSignMessage`)
      // const res = await signMessage(config, { message: 'hello world' })
      const { connector } = getAccount(config)
      const res = await signMessage(config, {
        connector,
        message: 'hello world',
      })
      console.log(`handleSignMessage res:`,res)
    }catch(error){

    }
  }
  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <div className="mb-4">
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
          <button onClick={init}>
           Init
          </button>
        </div>
      </div>
      <div className="mb-4">
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
          <p>Connected Account: {account}</p>
        </div>
      </div>
      <div className="mb-4">
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
          <button onClick={handleSendTx}>
            Send Transaction
          </button>
        </div>
      </div>
      <div className="mb-4">
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
          <button onClick={handleSignMessage}>
            Sign Message
          </button>
        </div>
      </div>
      <div className="mb-4">
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
          {txHash && <p>Tx Hash: {txHash}</p>}
        </div>
      </div>
      
      
      
     
    </div>
  )
}