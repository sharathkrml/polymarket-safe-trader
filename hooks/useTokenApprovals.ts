import { useCallback } from "react";
import { RelayClient } from "@polymarket/builder-relayer-client";
import { createUSDCApprovalTx, checkUSDCApproval } from "@/utils/approvals";

// Uses relayClient to set USDC token approvals for the CTF Exchange

export default function useTokenApprovals() {
  const checkUsdcApproval = useCallback(
    async (safeAddress: string): Promise<boolean> => {
      try {
        return await checkUSDCApproval(safeAddress);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to check approvals");
        throw error;
      }
    },
    []
  );

  const setUsdcTokenApprovals = useCallback(
    async (relayClient: RelayClient): Promise<boolean> => {
      try {
        const approvalTx = createUSDCApprovalTx();
        const response = await relayClient.execute(
          [approvalTx],
          "USDC approval on CTF Exchange"
        );
        await response.wait();
        return true;
      } catch (err) {
        console.error("Failed to set USDC token approvals:", err);
        return false;
      }
    },
    []
  );

  return {
    checkUsdcApproval,
    setUsdcTokenApprovals,
  };
}
