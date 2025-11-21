"use client";

import { useState } from "react";

import Card from "@/components/shared/Card";
import ActiveOrders from "@/components/Trading/Orders";
import UserPositions from "@/components/Trading/Positions";
import HighVolumeMarkets from "@/components/Trading/Markets";

import type { ClobClient } from "@polymarket/clob-client";
import { cn } from "@/utils/classNames";

type TabId = "positions" | "orders" | "markets";

interface Tab {
  id: TabId;
  label: string;
}

const tabs: Tab[] = [
  { id: "positions", label: "My Positions" },
  { id: "orders", label: "Open Orders" },
  { id: "markets", label: "Markets" },
];

type MarketTabsProps = {
  clobClient: ClobClient | null;
  walletAddress: string | undefined;
  safeAddress: string | null;
};

export default function MarketTabs({
  clobClient,
  walletAddress,
  safeAddress,
}: MarketTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("markets");

  return (
    <Card className="p-6">
      {/* Tab Navigation */}
      <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-1 flex gap-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200",
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-300 hover:text-white hover:bg-white/5"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "positions" && (
          <UserPositions
            safeAddress={safeAddress}
            clobClient={clobClient}
            walletAddress={walletAddress}
          />
        )}
        {activeTab === "orders" && (
          <ActiveOrders clobClient={clobClient} safeAddress={safeAddress} />
        )}
        {activeTab === "markets" && (
          <HighVolumeMarkets
            clobClient={clobClient}
            walletAddress={walletAddress}
          />
        )}
      </div>
    </Card>
  );
}
