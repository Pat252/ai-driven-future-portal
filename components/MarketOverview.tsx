'use client';

import { useEffect, useRef } from 'react';

export default function MarketOverview() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (container.current && !container.current.querySelector('script')) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "colorTheme": "dark",
        "dateRange": "12M",
        "showChart": true,
        "locale": "en",
        "largeChartUrl": "",
        "isTransparent": true,
        "showSymbolLogo": true,
        "showFloatingTooltip": false,
        "width": "100%",
        "height": "460",
        "plotLineColorGrowing": "rgba(41, 98, 255, 1)",
        "plotLineColorFalling": "rgba(41, 98, 255, 1)",
        "gridLineColor": "rgba(240, 243, 250, 0)",
        "scaleFontColor": "rgba(209, 212, 220, 1)",
        "belowLineFillColorGrowing": "rgba(41, 98, 255, 0.12)",
        "belowLineFillColorFalling": "rgba(41, 98, 255, 0.12)",
        "belowLineFillColorGrowingBottom": "rgba(41, 98, 255, 0)",
        "belowLineFillColorFallingBottom": "rgba(41, 98, 255, 0)",
        "symbolActiveColor": "rgba(41, 98, 255, 0.12)",
        "tabs": [
          {
            "title": "AI Platforms & Models",
            "symbols": [
              { "s": "NASDAQ:MSFT", "d": "Microsoft (OpenAI)" },
              { "s": "NASDAQ:GOOGL", "d": "Google (Gemini)" },
              { "s": "NASDAQ:META", "d": "Meta (Llama)" },
              { "s": "NASDAQ:AMZN", "d": "Amazon (Claude)" },
              { "s": "NASDAQ:TSLA", "d": "Tesla (xAI/Grok)" },
              { "s": "NASDAQ:AAPL", "d": "Apple (Apple Intel)" },
              { "s": "NASDAQ:ORCL", "d": "Oracle (Cloud Infra)" },
              { "s": "NYSE:IBM", "d": "IBM (Watsonx)" },
              { "s": "NYSE:SNOW", "d": "Snowflake (Data Cloud)" },
              { "s": "NYSE:NOW", "d": "ServiceNow (Workflows)" },
              { "s": "NASDAQ:SAP", "d": "SAP (Enterprise AI)" }
            ]
          },
          {
            "title": "Semiconductors & Infra",
            "symbols": [
              { "s": "NASDAQ:NVDA", "d": "NVIDIA (The King)" },
              { "s": "NASDAQ:AMD", "d": "AMD (The Challenger)" },
              { "s": "NASDAQ:TSM", "d": "TSMC (The Foundry)" },
              { "s": "NASDAQ:AVGO", "d": "Broadcom (Custom Silicon)" },
              { "s": "NASDAQ:ARM", "d": "ARM (Architecture)" },
              { "s": "NASDAQ:SMCI", "d": "Super Micro (Servers)" },
              { "s": "NASDAQ:MU", "d": "Micron (HBM Memory)" },
              { "s": "NASDAQ:ASML", "d": "ASML (Lithography)" },
              { "s": "NASDAQ:INTC", "d": "Intel (Foundry)" },
              { "s": "NASDAQ:QCOM", "d": "Qualcomm (Edge AI)" },
              { "s": "NASDAQ:MRVL", "d": "Marvell (Networking)" }
            ]
          },
          {
            "title": "Enterprise & Agents",
            "symbols": [
              { "s": "NASDAQ:PLTR", "d": "Palantir (AIP)" },
              { "s": "NASDAQ:CRM", "d": "Salesforce (Agents)" },
              { "s": "NASDAQ:CRWD", "d": "CrowdStrike (AI Security)" },
              { "s": "NASDAQ:ADBE", "d": "Adobe (Firefly)" },
              { "s": "NYSE:DDOG", "d": "Datadog (Observability)" },
              { "s": "NYSE:MDB", "d": "MongoDB (Vector DB)" },
              { "s": "NYSE:NET", "d": "Cloudflare (Edge Inference)" },
              { "s": "NYSE:PATH", "d": "UiPath (Automation)" },
              { "s": "NASDAQ:ZS", "d": "Zscaler (Zero Trust)" },
              { "s": "NASDAQ:DUOL", "d": "Duolingo (Consumer AI)" }
            ]
          },
          {
            "title": "Decentralized AI (Crypto)",
            "symbols": [
              { "s": "BINANCE:BTCUSDT", "d": "Bitcoin" },
              { "s": "BINANCE:ETHUSDT", "d": "Ethereum" },
              { "s": "BINANCE:SOLUSDT", "d": "Solana" },
              { "s": "BINANCE:FETUSDT", "d": "ASI Alliance (Fetch.ai)" },
              { "s": "BINANCE:TAOUSDT", "d": "Bittensor (Open Weights)" },
              { "s": "BINANCE:RENDERUSDT", "d": "Render (GPU Compute)" },
              { "s": "BINANCE:NEARUSDT", "d": "NEAR (Data Availability)" },
              { "s": "BINANCE:AKTUSDT", "d": "Akash (Decentralized Cloud)" },
              { "s": "BINANCE:WLDUSDT", "d": "Worldcoin (Identity)" },
              { "s": "BINANCE:GRTUSDT", "d": "The Graph (AI Data)" }
            ]
          }
        ]
      });
      container.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full mb-8 bg-[#1E222D] border border-white/10 rounded-xl overflow-hidden shadow-2xl" ref={container}>
      <div className="tradingview-widget-container">
        <div className="tradingview-widget-container__widget"></div>
      </div>
    </div>
  );
}

