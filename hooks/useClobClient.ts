import { useMemo } from "react";
import { providers } from "ethers";
import { ClobClient } from "@polymarket/clob-client";
import { useConnection, useWalletClient } from "wagmi";
import useSafeDeployment from "@/hooks/useSafeDeployment";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";

import { TradingSession } from "@/utils/session";
import {
  CLOB_API_URL,
  POLYGON_CHAIN_ID,
  REMOTE_SIGNING_URL,
} from "@/constants/polymarket";

// This hook is responsible for creating and managing the CLOB client instance
// It uses the custom session object's user API credentials to initialize the client
// It also includes the builder config for proper order attribution

export default function useClobClient(
  session: TradingSession | null,
  isComplete: boolean | undefined
) {
  const { safeAddress } = useSafeDeployment();
  const { address: eoaAddress } = useConnection();
  const { data: walletClient } = useWalletClient();

  const clobClient = useMemo(() => {
    if (
      !walletClient ||
      !eoaAddress ||
      !safeAddress ||
      !isComplete ||
      !session?.apiCredentials
    ) {
      return null;
    }

    try {
      const provider = new providers.Web3Provider(walletClient as any);
      const signer = provider.getSigner();

      // Builder config with remote server signing for order attribution
      const builderConfig = new BuilderConfig({
        remoteBuilderConfig: {
          url: REMOTE_SIGNING_URL(),
        },
      });

      // This is the persisted clobClient instance for creating and posting
      // orders for the user, with proper builder order attribution
      return new ClobClient(
        CLOB_API_URL,
        POLYGON_CHAIN_ID,
        signer,
        session.apiCredentials,
        2, // signatureType = 2 for browser wallet (Metamask, Rabby, etc.)
        safeAddress,
        undefined, // mandatory placeholder
        false,
        builderConfig // Builder attribution
      );
    } catch (error) {
      console.error("Failed to initialize CLOB client:", error);
      return null;
    }
  }, [
    walletClient,
    eoaAddress,
    safeAddress,
    isComplete,
    session?.apiCredentials,
  ]);

  return { clobClient };
}
