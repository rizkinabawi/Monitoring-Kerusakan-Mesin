"use client";

import dynamic from "next/dynamic";

const App = dynamic(() => import("./App"), {
  ssr: false,
  loading: () => (
    <main className="grid min-h-[100dvh] place-items-center bg-[#f2f1eb]">
      <p className="text-sm text-slate-600">Memuat sistem monitoring…</p>
    </main>
  ),
});

export default function ClientApp() {
  return <App />;
}