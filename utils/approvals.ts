import { createPublicClient, http } from "viem";
import {
  OperationType,
  SafeTransaction,
} from "@polymarket/builder-relayer-client";
import { polygon } from "viem/chains";
import { Interface } from "ethers/lib/utils";
import { USDC_ADDRESS, CTF_CONTRACT_ADDRESS } from "@/constants/tokens";
import { POLYGON_RPC_URL } from "@/constants/polymarket";

const erc20Interface = new Interface([
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
]);

const ERC20_ABI = [
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const publicClient = createPublicClient({
  chain: polygon,
  transport: http(POLYGON_RPC_URL),
});

export const checkUSDCApproval = async (
  safeAddress: string
): Promise<boolean> => {
  try {
    const allowance = await publicClient.readContract({
      address: USDC_ADDRESS as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [
        safeAddress as `0x${string}`,
        CTF_CONTRACT_ADDRESS as `0x${string}`,
      ],
    });

    // Check if allowance is greater than 0
    // We use a high threshold to ensure it's sufficient
    const threshold = BigInt("1000000000000"); // 1M USDC (6 decimals)
    return allowance >= threshold;
  } catch (error) {
    console.warn("Failed to check USDC approval:", error);
    return false; // If check fails, assume no approval
  }
};

export const createUSDCApprovalTx = (): SafeTransaction => ({
  to: USDC_ADDRESS,
  operation: OperationType.Call,
  data: erc20Interface.encodeFunctionData("approve", [
    CTF_CONTRACT_ADDRESS,
    "115792089237316195423570985008687907853269984665640564039457584007913129639935",
  ]),
  value: "0",
});
