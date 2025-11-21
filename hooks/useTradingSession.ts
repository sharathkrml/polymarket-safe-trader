import { useConnection } from "wagmi";
import { useState, useCallback, useEffect } from "react";
import useRelayClient from "@/hooks/useRelayClient";
import useTokenApprovals from "@/hooks/useTokenApprovals";
import useSafeDeployment from "@/hooks/useSafeDeployment";
import useUserApiCredentials from "@/hooks/useUserApiCredentials";

import {
  loadSession,
  saveSession,
  clearSession as clearStoredSession,
  TradingSession,
  SessionStep,
} from "@/utils/session";

// This is the coordination hook that manages the user's trading session
// It orchestrates the steps for initializing the clob and relay clients
// It creates, stores, and loads the user's L2 credentials for the trading session (API credentials)
// It deploys the Safe and sets token approvals for the CTF Exchange

export default function useTradingSession() {
  const [error, setError] = useState<Error | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [session, setSession] = useState<TradingSession | null>(null);

  const tokenApprovals = useTokenApprovals();
  const { address: eoaAddress } = useConnection();
  const relayClient = useRelayClient(eoaAddress);
  const userApiCredentials = useUserApiCredentials();
  const [currentStep, setCurrentStep] = useState<SessionStep>("idle");
  const { safeAddress, checkDeployment, deploy } = useSafeDeployment();

  // We use a custom session object from localStorage to track the status of the user's trading session
  useEffect(() => {
    if (!eoaAddress) {
      setSession(null);
      setCurrentStep("idle");
      setStatusMessage("");
      setError(null);
      return;
    }

    const stored = loadSession(eoaAddress);
    // Always set session (even if null) to clear previous wallet's session
    setSession(stored);

    // Reset state when switching wallets
    if (!stored) {
      setCurrentStep("idle");
      setStatusMessage("");
      setError(null);
    }
  }, [eoaAddress]);

  const initialize = useCallback(async () => {
    if (!eoaAddress) {
      throw new Error("Wallet not connected");
    }

    setCurrentStep("checking");
    setError(null);

    try {
      // Load existing session to check what steps the user has already completed
      const existingSession = loadSession(eoaAddress);

      // Step 1: Initializes relayClient with the user's EOA signer and
      // the builder's API credentials (via remote signing) for order attribution
      setStatusMessage("Initializing relay client...");
      const relay = await relayClient.initialize();

      // Step 2: Get Safe address (deterministic derivation from EOA)
      if (!safeAddress) {
        throw new Error("Failed to derive Safe address");
      } else {
        console.log("Safe address:", safeAddress);
      }

      // Step 3: Check if Safe is deployed
      setStatusMessage("Checking Safe deployment...");
      let isDeployed = await checkDeployment(relay, safeAddress);

      // Step 4: Deploy Safe if not already deployed
      if (!isDeployed) {
        setCurrentStep("deploying");
        setStatusMessage("");
        await deploy(relay);
      } else {
        console.log("Safe already deployed, skipping deployment...");
        setStatusMessage("Safe already deployed, skipping deployment...");
      }

      // Step 5: Get user's API credentials (either derive or create)
      // and store them in the custom session object
      let apiCreds = existingSession?.apiCredentials;
      if (
        !existingSession?.hasApiCredentials ||
        !apiCreds ||
        !apiCreds.key ||
        !apiCreds.secret ||
        !apiCreds.passphrase
      ) {
        setCurrentStep("credentials");
        apiCreds = await userApiCredentials.getOrCreateCredentials();
      } else {
        console.log("Using existing API credentials from session");
      }

      // Step 6: Check for USDC token approval for the CTF Exchange
      let hasApprovals = existingSession?.hasApprovals || false;
      if (!hasApprovals) {
        setCurrentStep("approvals");
        hasApprovals = await tokenApprovals.setApprovals(relay, safeAddress);
      } else {
        console.log("Approvals already exist, skipping...");
      }

      // Step 7: Create custom session object and add the user's
      // API credentials (from step 5) as apiCredentials
      const newSession: TradingSession = {
        eoaAddress: eoaAddress,
        safeAddress: safeAddress.toLowerCase(),
        isSafeDeployed: true,
        hasApiCredentials: true,
        hasApprovals,
        apiCredentials: apiCreds,
        lastChecked: Date.now(),
      };

      setSession(newSession);
      saveSession(eoaAddress, newSession);

      setCurrentStep("complete");
      setStatusMessage("Trading session ready!");
    } catch (err) {
      console.error("Session initialization error:", err);
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      setCurrentStep("idle");
    }
  }, [
    eoaAddress,
    relayClient,
    safeAddress,
    checkDeployment,
    deploy,
    userApiCredentials,
    tokenApprovals,
  ]);

  const endSession = useCallback(() => {
    if (!eoaAddress) return;

    clearStoredSession(eoaAddress);
    setSession(null);
    relayClient.clear();
    setCurrentStep("idle");
    setError(null);
    setStatusMessage("");
  }, [eoaAddress, relayClient]);

  return {
    session,
    currentStep,
    statusMessage,
    error,
    isComplete:
      session?.isSafeDeployed &&
      session?.hasApiCredentials &&
      session?.hasApprovals,
    initialize,
    endSession,
  };
}
