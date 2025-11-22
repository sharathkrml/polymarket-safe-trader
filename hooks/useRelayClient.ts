import { providers } from "ethers";
import { useWalletClient } from "wagmi";
import { useState, useCallback } from "react";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";
import { RelayClient } from "@polymarket/builder-relayer-client";

import {
  RELAYER_URL,
  POLYGON_CHAIN_ID,
  REMOTE_SIGNING_URL,
} from "@/constants/polymarket";

// This hook is responsible for creating and managing the relay client instance
// The user's EOA address and wallet client are used to initialize the relay client
// The builder config is included for proper builder order attribution
// It returns null if the wallet is not connected or the EOA address is not provided

export default function useRelayClient(eoaAddress?: string) {
  const [relayClient, setRelayClient] = useState<RelayClient | null>(null);
  const { data: walletClient } = useWalletClient();

  // This function initializes the relay client with the
  // user's EOA signer and builder's API credentials
  const initializeRelayClient = useCallback(async () => {
    if (!eoaAddress || !walletClient) {
      throw new Error("Wallet not connected");
    }

    try {
      const provider = new providers.Web3Provider(walletClient as any);
      const signer = provider.getSigner();

      // Builder config is obtained from 'polymarket.com/settings?tab=builder'
      // A remote signing server is used to enable remote signing for order attribution
      // This allows the builder credentials to be kept secure while signing requests

      const builderConfig = new BuilderConfig({
        remoteBuilderConfig: {
          url: REMOTE_SIGNING_URL(),
        },
      });

      // The relayClient instance is used for deploying the Safe,
      // setting token approvals, and executing CTF operations such
      // as splitting, merging, and redeeming positions.

      const client = new RelayClient(
        RELAYER_URL,
        POLYGON_CHAIN_ID,
        signer,
        builderConfig
      );

      setRelayClient(client);
      return client;
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error("Failed to initialize relay client");
      throw error;
    }
  }, [eoaAddress, walletClient]);

  // This function clears the relay client and resets the state
  const clearRelayClient = useCallback(() => {
    setRelayClient(null);
  }, []);

  return {
    relayClient,
    initializeRelayClient,
    clearRelayClient,
  };
}
