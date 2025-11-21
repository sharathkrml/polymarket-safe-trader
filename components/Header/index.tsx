"use client";

import { useConnection, useDisconnect } from "wagmi";
import { useState, useEffect, useCallback } from "react";

import WalletInfo from "@/components/Header/WalletInfo";
import ConnectButton from "@/components/Header/ConnectButton";

export default function Header() {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const { address: eoaAddress } = useConnection();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (eoaAddress) {
      setIsConnectModalOpen(false);
    }
  }, [eoaAddress, setIsConnectModalOpen]);

  const handleDisconnect = useCallback(async () => {
    try {
      setIsConnectModalOpen(false);
      disconnect();
    } catch (error) {
      console.error("Disconnect error:", error);
    } finally {
      setIsConnectModalOpen(false);
    }
  }, [disconnect, setIsConnectModalOpen]);

  return (
    <div className="flex flex-col items-center relative">
      {eoaAddress ? (
        <WalletInfo onDisconnect={handleDisconnect} />
      ) : (
        <ConnectButton
          isModalOpen={isConnectModalOpen}
          onToggleModal={() => setIsConnectModalOpen(!isConnectModalOpen)}
          onConnect={() => setIsConnectModalOpen(false)}
        />
      )}
    </div>
  );
}
