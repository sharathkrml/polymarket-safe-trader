"use client";

import { useConnection } from "wagmi";
import useClobClient from "@/hooks/useClobClient";
import useSafeDeployment from "@/hooks/useSafeDeployment";
import useTradingSession from "@/hooks/useTradingSession";

import Header from "@/components/Header";
import PolygonAssets from "@/components/PolygonAssets";
import TradingSession from "@/components/TradingSession";
import MarketTabs from "@/components/Trading/MarketTabs";

export default function Home() {
  const { safeAddress } = useSafeDeployment();
  const { address: eoaAddress } = useConnection();
  const {
    session,
    currentStep,
    statusMessage,
    error,
    isComplete,
    initialize,
    endSession,
  } = useTradingSession();
  const { clobClient } = useClobClient(session, isComplete);

  return (
    <div className="p-6 min-h-screen flex flex-col gap-6 max-w-7xl mx-auto">
      <Header />
      <PolygonAssets />
      <TradingSession
        session={session}
        currentStep={currentStep}
        statusMessage={statusMessage}
        error={error}
        isComplete={isComplete}
        initialize={initialize}
        endSession={endSession}
      />
      {isComplete && eoaAddress && (
        <MarketTabs
          clobClient={clobClient}
          walletAddress={eoaAddress}
          safeAddress={safeAddress}
        />
      )}
    </div>
  );
}
