import type { PolymarketPosition } from "@/hooks/useUserPositions";

import Card from "@/components/shared/Card";
import StatDisplay from "@/components/shared/StatDisplay";

import {
  formatCurrency,
  formatShares,
  formatPercentage,
} from "@/utils/formatting";
import { cn } from "@/utils/classNames";

interface PositionCardProps {
  position: PolymarketPosition;
  onSell: (position: PolymarketPosition) => void;
  isSelling: boolean;
  isPendingVerification: boolean;
  isSubmitting: boolean;
  canSell: boolean;
}

export default function PositionCard({
  position,
  onSell,
  isSelling,
  isPendingVerification,
  isSubmitting,
  canSell,
}: PositionCardProps) {
  return (
    <Card className="p-4 space-y-3">
      {/* Market Title and Icon */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{position.title}</h3>
          <p className="text-sm text-white/70 mt-1">
            Outcome: <span className="text-white">{position.outcome}</span>
          </p>
        </div>
        {position.icon && (
          <img src={position.icon} alt="" className="w-12 h-12 rounded" />
        )}
      </div>

      {/* Position Stats Grid */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <StatDisplay
          label="Size"
          value={`${formatShares(position.size)} shares`}
        />
        <StatDisplay
          label="Avg Price"
          value={formatCurrency(position.avgPrice, 3)}
        />
        <StatDisplay
          label="Current Price"
          value={formatCurrency(position.curPrice, 3)}
        />
        <StatDisplay
          label="Current Value"
          value={formatCurrency(position.currentValue)}
        />
        <StatDisplay
          label="Initial Value"
          value={formatCurrency(position.initialValue)}
        />
        <StatDisplay
          label="P&L"
          value={`${formatCurrency(position.cashPnl)} (${formatPercentage(position.percentPnl)})`}
          highlight={true}
          highlightColor={position.cashPnl >= 0 ? "green" : "red"}
        />
      </div>

      {/* Redeemable Event Banner */}
      {position.redeemable && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
          <p className="text-purple-300 text-sm font-medium">
            Event Completed - Position Redeemable
          </p>
        </div>
      )}

      {/* Market Sell Button */}
      <button
        onClick={() => onSell(position)}
        disabled={
          isSelling ||
          isSubmitting ||
          !canSell ||
          position.redeemable ||
          isPendingVerification
        }
        className={cn(
          "w-full py-2 font-medium rounded-lg transition-colors",
          isSelling || isPendingVerification
            ? "bg-yellow-600/70 cursor-wait text-white"
            : "bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white"
        )}
      >
        {isSelling || isPendingVerification ? "Processing..." : "Market Sell"}
      </button>

      {/* CLOB Client Warning */}
      {!canSell && (
        <p className="text-xs text-yellow-400 text-center -mt-2">
          Initialize CLOB client first
        </p>
      )}
    </Card>
  );
}
