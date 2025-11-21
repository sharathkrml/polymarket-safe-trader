import { providers } from "ethers";
import { useState, useCallback, useMemo } from "react";
import { useConnection, useWalletClient } from "wagmi";
import { RelayClient } from "@polymarket/builder-relayer-client";
import { deriveSafe } from "@polymarket/builder-relayer-client/dist/builder/derive";
import { getContractConfig } from "@polymarket/builder-relayer-client/dist/config";
import { POLYGON_CHAIN_ID } from "@/constants/polymarket";

export default function useSafeDeployment() {
  const [isChecking, setIsChecking] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { address, isConnected } = useConnection();
  const { data: walletClient } = useWalletClient();

  // Derive Safe address from EOA
  const safeAddress = useMemo(() => {
    if (!address || !isConnected || !POLYGON_CHAIN_ID) return null;

    try {
      const config = getContractConfig(POLYGON_CHAIN_ID);
      return deriveSafe(address, config.SafeContracts.SafeFactory);
    } catch (error) {
      console.error("Error deriving Safe address:", error);
      return null;
    }
  }, [address, isConnected, POLYGON_CHAIN_ID]);

  const checkDeployment = useCallback(
    async (relayClient: RelayClient, safeAddr: string): Promise<boolean> => {
      setIsChecking(true);
      setError(null);

      try {
        // Try relayClient first
        const deployed = await (relayClient as any).getDeployed(safeAddr);
        return deployed;
      } catch (err) {
        console.warn("API check failed, falling back to RPC", err);

        // Fallback to RPC
        if (walletClient) {
          const provider = new providers.Web3Provider(walletClient as any);
          const code = await provider.getCode(safeAddr);
          return code !== "0x" && code.length > 2;
        }

        return false;
      } finally {
        setIsChecking(false);
      }
    },
    [walletClient]
  );

  const deploy = useCallback(
    async (relayClient: RelayClient): Promise<string> => {
      setIsDeploying(true);
      setError(null);

      try {
        // Deploys Safe using the relayClient
        // Prompts signer for a signature
        const response = await relayClient.deploy();
        const result = await response.wait();

        if (!result) {
          throw new Error("Safe deployment failed");
        }

        return result.proxyAddress;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to deploy Safe");
        setError(error);
        throw error;
      } finally {
        setIsDeploying(false);
      }
    },
    []
  );

  return {
    safeAddress,
    isChecking,
    isDeploying,
    error,
    checkDeployment,
    deploy,
  };
}
