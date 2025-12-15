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
  const [hourlyChange, setHourlyChange] = useState<number>(0);
  const [dailyChange, setDailyChange] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [usdcAmount, setUsdcAmount] = useState<number>(0);
  const [usdtAmount, setUsdtAmount] = useState<number>(0);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function load() {
  if (!process.env.NEXT_PUBLIC_RPC) {
    console.error("RPC endpoint not configured");
    setLoading(false);
    return;
  }

  try {
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
    
    setUsdcAmount(usdcValue);
    setUsdtAmount(usdtValue);
    setTotal(value);

    // Create timestamp for update
    const now = new Date();
    setLastUpdate(now.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }));

    // Calculate changes
    if (typeof window !== 'undefined') {
      const currentHour = now.getHours();
      const currentDate = now.getDate();
      
      // Get stored values
      const storedHourly = localStorage.getItem("gensyn_hourly_value");
      const storedHourlyTime = localStorage.getItem("gensyn_hourly_time");
      
      const storedDaily = localStorage.getItem("gensyn_daily_value");
      const storedDailyDate = localStorage.getItem("gensyn_daily_date");

      // Calculate hourly change (if same hour)
      if (storedHourly && storedHourlyTime) {
        const storedHour = parseInt(storedHourlyTime);
        if (storedHour === currentHour) {
          setHourlyChange(value - parseFloat(storedHourly));
        } else {
          setHourlyChange(0);
        }
      }

      // Calculate daily change (if same day)
      if (storedDaily && storedDailyDate) {
        const storedDate = parseInt(storedDailyDate);
        if (storedDate === currentDate) {
          setDailyChange(value - parseFloat(storedDaily));
        } else {
          setDailyChange(0);
        }
      }

      // Store current values
      localStorage.setItem("gensyn_hourly_value", value.toString());
      localStorage.setItem("gensyn_hourly_time", currentHour.toString());
      
      // Reset daily at midnight
      if (now.getHours() === 0 && now.getMinutes() < 1) {
        localStorage.setItem("gensyn_daily_value", value.toString());
        localStorage.setItem("gensyn_daily_date", currentDate.toString());
      } else if (!storedDailyDate) {
        localStorage.setItem("gensyn_daily_value", value.toString());
        localStorage.setItem("gensyn_daily_date", currentDate.toString());
      }
    }
  } catch (err) {
    console.error("Failed to load sale data:", err);
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a14] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Gensyn Public Sale
          </h1>
          <p className="text-gray-400 text-lg">Real-time investment tracker for $GENSYN on Sonar</p>
        </div>

        {/* Follow Button */}
        <div className="flex justify-center mb-10">
          <a
            href="https://x.com/0xzackhq"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-full font-semibold transition-all transform hover:scale-105 shadow-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Follow @0xzackhq
          </a>
        </div>

        {/* Live Status */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-green-400 font-semibold">SALE IS LIVE</span>
          </div>
        </div>

        {/* Main Stats Card */}
        <div className="bg-[#1a1a2e]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-8 mb-10 shadow-2xl">
          {/* Total Invested */}
          <div className="text-center mb-12">
            <div className="text-gray-400 text-sm uppercase tracking-wider mb-3">TOTAL INVESTED</div>
            <div className="text-6xl md:text-7xl font-bold mb-3">
              {loading ? (
                <div className="animate-pulse">
                  <span className="text-gray-600">$--,---,---</span>
                </div>
              ) : (
                <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                  ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
            <div className="text-gray-400">USDC + USDT</div>
          </div>

          {/* Token Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white/5 rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-gray-400">USDC</div>
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs">U</div>
              </div>
              <div className="text-2xl font-semibold">
                ${usdcAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            
            <div className="bg-white/5 rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-gray-400">USDT</div>
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs">T</div>
              </div>
              <div className="text-2xl font-semibold">
                ${usdtAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Change Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Hourly Change */}
            <div className="text-center">
              <div className="text-gray-400 text-sm mb-2">Hourly Change</div>
              <div className={`text-3xl font-bold ${hourlyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {hourlyChange >= 0 ? '+' : ''}${Math.abs(hourlyChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-gray-500 text-sm mt-2">Updated: {lastUpdate}</div>
            </div>

            {/* Daily Change */}
            <div className="text-center">
              <div className="text-gray-400 text-sm mb-2">Daily Change</div>
              <div className={`text-3xl font-bold ${dailyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {dailyChange >= 0 ? '+' : ''}${Math.abs(dailyChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-gray-500 text-sm mt-2">Since midnight UTC</div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-gray-500 text-sm space-y-2">
          <div className="flex flex-wrap justify-center items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Network: Sonar</span>
            </div>
            <div className="hidden md:block">•</div>
            <div>
              Contract: <span className="font-mono text-gray-400">{SALE_CONTRACT.slice(0, 6)}...{SALE_CONTRACT.slice(-4)}</span>
            </div>
            <div className="hidden md:block">•</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Live updates every 30s</span>
            </div>
          </div>
          
          <div className="pt-4">
            <a 
              href={`https://sonar.xyz/token/eth/${SALE_CONTRACT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition"
            >
              View on Sonar
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
