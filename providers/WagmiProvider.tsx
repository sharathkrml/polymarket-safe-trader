"use client";

import { ReactNode } from "react";
import { WagmiProvider as Wagmi, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { polygon } from "wagmi/chains";
import { http } from "viem";

const config = createConfig({
  chains: [polygon],
  transports: {
    [polygon.id]: http(
      process.env.NEXT_PUBLIC_POLYGON_RPC_URL || "https://polygon-rpc.com"
    ),
  },
  connectors: [injected({ shimDisconnect: true })],
  ssr: true,
});

export default function WagmiProvider({ children }: { children: ReactNode }) {
  return <Wagmi config={config}>{children}</Wagmi>;
}
