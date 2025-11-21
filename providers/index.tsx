"use client";

import { ReactNode } from "react";
import QueryProvider from "./QueryProvider";
import WagmiProvider from "./WagmiProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider>
      <QueryProvider>{children}</QueryProvider>
    </WagmiProvider>
  );
}
