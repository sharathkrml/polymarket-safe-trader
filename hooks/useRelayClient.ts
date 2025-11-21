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
// It uses the user's EOA address and wallet client to initialize the relay client
// It also includes the builder config for proper builder order attribution
// It returns null if the wallet is not connected or the EOA address is not provided

export default function useRelayClient(address?: string) {
  const [error, setError] = useState<Error | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [relayClient, setRelayClient] = useState<RelayClient | null>(null);
  const { data: walletClient } = useWalletClient();

  const initialize = useCallback(async () => {
    if (!address || !walletClient) {
      throw new Error("Wallet not connected");
    }

    setIsInitializing(true);
    setError(null);

    try {
      const provider = new providers.Web3Provider(walletClient as any);
      const signer = provider.getSigner();

      // Builder config is obtained from 'polymarket.com/settings?tab=builder'
      // We use the Builder Signing Server to enable remote signing
      // This allows you to keep your builder credentials secure while signing requests

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
      setError(error);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  }, [address, walletClient]);

  const clear = useCallback(() => {
    setRelayClient(null);
    setError(null);
  }, []);

  return {
    relayClient,
    isInitializing,
    error,
    initialize,
    clear,
  };
}
