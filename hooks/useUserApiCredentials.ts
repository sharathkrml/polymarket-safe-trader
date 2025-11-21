import { providers } from "ethers";
import { useWalletClient } from "wagmi";
import { useState, useCallback } from "react";
import { ClobClient } from "@polymarket/clob-client";
import { CLOB_API_URL, POLYGON_CHAIN_ID } from "@/constants/polymarket";

export interface ApiCredentials {
  key: string;
  secret: string;
  passphrase: string;
}

export default function useUserApiCredentials() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { data: walletClient } = useWalletClient();

  const getOrCreateCredentials =
    useCallback(async (): Promise<ApiCredentials> => {
      if (!walletClient) {
        throw new Error("Wallet not connected");
      }

      setIsLoading(true);
      setError(null);

      try {
        const provider = new providers.Web3Provider(walletClient as any);
        const signer = provider.getSigner();

        // Temporary ClobClient which will be destroyed immediately
        // after getting the user's API credentials
        const tempClient = new ClobClient(
          CLOB_API_URL,
          POLYGON_CHAIN_ID,
          signer
        );

        // Try to derive the user's existing API key first (for returning users)
        // or create a new one if it doesn't exist.

        try {
          console.log("Attempting to derive existing API key...");
          // Prompts signer for a signature to derive their API key
          const creds = await tempClient.deriveApiKey();
          console.log("Derived API key result:", creds);

          // Validate that derived credentials actually have values
          if (creds?.key && creds?.secret && creds?.passphrase) {
            console.log("Successfully derived existing API key");
            return creds;
          } else {
            console.log(
              "Derived credentials are invalid, creating new ones..."
            );
            throw new Error("Invalid derived credentials");
          }
        } catch (deriveError) {
          // If derive fails or returns invalid data, create new API key
          console.log("Creating new API key...");
          const creds = await tempClient.createApiKey();
          console.log("Created API key result:", creds);
          console.log("Successfully created new API key");
          return creds;
        }
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to get credentials");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    }, [walletClient]);

  return {
    isLoading,
    error,
    getOrCreateCredentials,
  };
}
