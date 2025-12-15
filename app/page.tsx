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
  const [total, setTotal] = useState(0);
  const [hourly, setHourly] = useState(0);
  const [daily, setDaily] = useState(0);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC);

    const usdc = new ethers.Contract(USDC, ERC20_ABI, provider);
    const usdt = new ethers.Contract(USDT, ERC20_ABI, provider);

    const [usdcBal, usdtBal] = await Promise.all([
      usdc.balanceOf(SALE_CONTRACT),
      usdt.balanceOf(SALE_CONTRACT)
    ]);

    const value = Number(ethers.formatUnits(usdcBal, 6)) + Number(ethers.formatUnits(usdtBal, 6));
    setTotal(value);

    // NOTE: replace with DB / KV snapshots for accuracy
    const lastHour = Number(localStorage.getItem("h") || value);
    const lastDay = Number(localStorage.getItem("d") || value);

    setHourly(value - lastHour);
    setDaily(value - lastDay);

    localStorage.setItem("h", value);
    if (new Date().getHours() === 0) localStorage.setItem("d", value);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0b0620] via-[#1a1240] to-[#0b1b2a] text-white flex items-center justify-center">
      <div className="w-full max-w-4xl rounded-3xl p-10 bg-white/5 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-violet-300">Gensyn Public Sale</h1>
          <a
            href="https://x.com/0xzackhq"
            className="px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-500 transition"
          >
            Follow @0xzackhq
          </a>
        </div>

        <p className="text-gray-400 mb-2">Live tracking (Sonar · Ethereum)</p>

        <div className="text-center my-12">
          <div className="text-sm text-green-400 mb-1">SALE IS LIVE</div>
          <div className="text-6xl font-extrabold text-pink-400">${total.toLocaleString()}</div>
          <div className="text-gray-400 mt-1">USDC + USDT committed</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Stat label="Hourly Change" value={hourly} />
          <Stat label="Daily Change" value={daily} />
          <Stat label="Network" value="Ethereum" />
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/5 p-6 text-center">
      <div className="text-gray-400 text-sm mb-2">{label}</div>
      <div className="text-xl font-semibold text-green-400">
        {typeof value === "number" ? `+$${value.toLocaleString()}` : value}
      </div>
    </div>
  );
}
