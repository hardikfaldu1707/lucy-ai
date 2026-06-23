import type { Metadata } from "next";
import { CoinPacksAdminClient } from "./coin-packs-client";

export const metadata: Metadata = { title: "Coin packs" };

export default function AdminCoinPacksPage() {
  return <CoinPacksAdminClient />;
}
