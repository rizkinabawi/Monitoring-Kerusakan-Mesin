import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowRight, Factory, ShieldCheck } from "lucide-react";
import { useLogin, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Field, TextInput, errorText } from "@/components/shared/common";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [issue, setIssue] = useState("");
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const login = useLogin();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setIssue("");
    login.mutate(
      { data: { username, password } },
      {
        onSuccess: async () => {
          await client.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setLocation("/dashboard");
        },
        onError: (e) => setIssue(errorText(e)),
      }
    );
  };

  return (
    <main className="grid min-h-[100dvh] bg-[#f2f1eb] lg:grid-cols-[1fr_1fr]">
      {/* Kolom Branding Kiri */}
      <section className="relative hidden overflow-hidden bg-[#203b49] p-12 text-[#f5f1e8] lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 size-[520px] rounded-full border border-white/10" />
        <div className="absolute -right-7 -top-7 size-[360px] rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-amber-400 text-slate-900">
            <Factory className="size-5" />
          </div>
          <span className="text-sm font-semibold tracking-wide">SHIFT / MONITOR</span>
        </div>
        <div className="relative max-w-lg">
          <div className="mb-7 flex items-center gap-2 font-mono text-xs uppercase tracking-[.17em] text-amber-300">
            <span className="size-2 rounded-full bg-amber-300" /> Konsol operasi pabrik
          </div>
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-.05em]">
            Setiap menit<br />tercatat.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
            Pantau kondisi mesin, kerusakan yang sedang ditangani, dan pekerjaan perawatan agar produksi terus berjalan.
          </p>
        </div>
        <p className="relative font-mono text-[10px] tracking-[.14em] text-slate-400">
          OPERASI PERAWATAN · AKSES STAF TERLINDUNGI
        </p>
      </section>

      {/* Kolom Formulir Login Kanan */}
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[390px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="grid size-10 place-items-center rounded-xl bg-[#203b49] text-amber-300">
              <Factory className="size-5" />
            </div>
            <b className="text-sm tracking-wide">SHIFT / MONITOR</b>
          </div>
          <div className="mb-8">
            <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.18em] text-amber-700">
              Akses staf
            </p>
            <h2 className="text-3xl font-semibold tracking-[-.04em]">Masuk ke akun Anda</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Gunakan akun operasional yang telah diberikan.
            </p>
          </div>
          <form onSubmit={submit} className="space-y-5">
            <Field label="Nama pengguna">
              <TextInput
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                data-testid="input-username"
                placeholder="Nama pengguna Anda"
              />
            </Field>
            <Field label="Kata sandi">
              <TextInput
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password"
                placeholder="Kata sandi Anda"
              />
            </Field>
            {issue && (
              <div
                className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
                data-testid="text-login-error"
              >
                {issue}
              </div>
            )}
            <Button
              type="submit"
              disabled={login.isPending}
              className="h-11 w-full rounded-lg bg-[#244858] text-sm hover:bg-[#1b3948]"
              data-testid="button-login"
            >
              {login.isPending ? "Sedang masuk…" : "Masuk"}
              <ArrowRight className="size-4" />
            </Button>
          </form>
          <div className="mt-8 flex items-center gap-2 border-t border-[#deded6] pt-5 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-emerald-700" />
            Sesi Anda dilindungi melalui autentikasi server yang aman.
          </div>
        </div>
      </section>
    </main>
  );
}

