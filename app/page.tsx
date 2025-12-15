"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";

// ---------------- CONFIG ----------------
const SALE_CONTRACT = "0x73612914c81A9c072333Ea9EA71a9b26a5B9a707";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

export default function Page() {
  const [total, setTotal] = useState<number>(0);
  const [hourly, setHourly] = useState<number>(0);
  const [daily, setDaily] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  async function load() {
    if (!process.env.NEXT_PUBLIC_RPC) {
      setError("RPC endpoint not configured");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC);
      const usdc = new ethers.Contract(USDC, ERC20_ABI, provider);
      const usdt = new ethers.Contract(USDT, ERC20_ABI, provider);

      const [usdcBal, usdtBal] = await Promise.all([
        usdc.balanceOf(SALE_CONTRACT),
        usdt.balanceOf(SALE_CONTRACT)
      ]);

      const usdcValue = Number(ethers.formatUnits(usdcBal, 6));
      const usdtValue = Number(ethers.formatUnits(usdtBal, 6));
      const value = usdcValue + usdtValue;
      
      setTotal(value);

      // Only access localStorage in browser environment
      if (typeof window !== 'undefined') {
        const storedHour = localStorage.getItem("gensyn_hourly");
        const storedDay = localStorage.getItem("gensyn_daily");
        
        const lastHour = storedHour ? parseFloat(storedHour) : value;
        const lastDay = storedDay ? parseFloat(storedDay) : value;
        
        setHourly(parseFloat((value - lastHour).toFixed(2)));
        setDaily(parseFloat((value - lastDay).toFixed(2)));
        
        // Store current value for next comparison
        localStorage.setItem("gensyn_hourly", value.toString());
        
        // Reset daily value at midnight UTC
        const now = new Date();
        if (now.getUTCHours() === 0 && now.getUTCMinutes() < 1) {
          localStorage.setItem("gensyn_daily", value.toString());
        }
      }
    } catch (err) {
      console.error("Failed to load sale data:", err);
      setError("Failed to fetch sale data. Check RPC configuration.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0b0620] via-[#1a1240] to-[#0b1b2a] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-3xl p-6 md:p-10 bg-white/5 backdrop-blur-xl shadow-2xl border border-white/10">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-bold text-violet-300 text-center md:text-left">
            Gensyn Public Sale Tracker
          </h1>
          <a
            href="https://x.com/0xzackhq"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full bg-violet-600 hover:bg-violet-500 transition-colors font-medium"
          >
            Follow @0xzackhq
          </a>
        </div>

        <p className="text-gray-400 mb-2 text-center md:text-left">
          Live tracking (Ethereum Mainnet)
        </p>

        {error && (
          <div className="my-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <p className="text-red-300">{error}</p>
            <p className="text-sm text-red-400/80 mt-1">
              Make sure NEXT_PUBLIC_RPC is set in Vercel environment variables
            </p>
          </div>
        )}

        <div className="text-center my-12">
          <div className="text-sm text-green-400 mb-1 flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            SALE IS LIVE • UPDATING EVERY MINUTE
          </div>
          <div className="text-5xl md:text-6xl font-extrabold text-pink-400 my-4">
            {loading && total === 0 ? (
              <div className="inline-block">
                <span className="opacity-50">$--,--</span>
                <span className="ml-2 text-2xl">⏳</span>
              </div>
            ) : (
              `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </div>
          <div className="text-gray-400 mt-1">USDC + USDT committed</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Stat 
            label="Hourly Change" 
            value={hourly} 
            loading={loading}
          />
          <Stat 
            label="Daily Change" 
            value={daily} 
            loading={loading}
          />
          <div className="rounded-2xl bg-white/5 p-6 text-center border border-white/10">
            <div className="text-gray-400 text-sm mb-2">Network</div>
            <div className="text-xl font-semibold text-blue-400">Ethereum</div>
            <div className="text-xs text-gray-500 mt-2">Mainnet</div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <div>
              Contract: <span className="font-mono text-gray-400">{SALE_CONTRACT.slice(0, 6)}...{SALE_CONTRACT.slice(-4)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <a 
              href={`https://etherscan.io/address/${SALE_CONTRACT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 transition"
            >
              View on Etherscan →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, loading }: { 
  label: string; 
  value: number; 
  loading?: boolean;
}) {
  const isPositive = value >= 0;
  
  return (
    <div className="rounded-2xl bg-white/5 p-6 text-center border border-white/10">
      <div className="text-gray-400 text-sm mb-2">{label}</div>
      <div className={`text-2xl font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {loading && value === 0 ? (
          <span className="opacity-50">--</span>
        ) : (
          `${isPositive ? '+' : ''}$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        )}
      </div>
      <div className="text-xs text-gray-500 mt-2">
        {isPositive ? 'Increase' : 'Decrease'} in period
      </div>
    </div>
  );
}
