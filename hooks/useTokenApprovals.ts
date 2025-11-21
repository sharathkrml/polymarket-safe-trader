import { useState, useCallback } from "react";
import { RelayClient } from "@polymarket/builder-relayer-client";
import { createUSDCApprovalTx, checkUSDCApproval } from "@/utils/approvals";

export default function useTokenApprovals() {
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setApprovals = useCallback(
    async (relayClient: RelayClient, safeAddress: string): Promise<boolean> => {
      setIsApproving(true);
      setError(null);

      try {
        // Check if approval already exists
        const hasApproval = await checkUSDCApproval(safeAddress);

        if (hasApproval) {
          console.log("USDC approval already exists, skipping...");
          return true; // Already approved
        }

        console.log("Setting USDC approval...");
        const approvalTx = createUSDCApprovalTx();
        const response = await relayClient.execute(
          [approvalTx],
          "USDC approval on CTF Exchange"
        );
        await response.wait();
        return true;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to set approvals");
        setError(error);
        throw error;
      } finally {
        setIsApproving(false);
      }
    },
    []
  );

  return {
    isApproving,
    error,
    setApprovals,
  };
}
