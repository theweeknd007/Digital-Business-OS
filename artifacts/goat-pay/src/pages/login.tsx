import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Chrome, Apple, Facebook, ShieldCheck } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

type AuthMode = "login" | "register" | "forgot" | "verify" | "2fa";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const isDark = theme === "dark";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (mode === "login") setLocation("/dashboard");
      else if (mode === "register") setMode("verify");
      else if (mode === "forgot") setMode("verify");
      else if (mode === "verify") setMode("2fa");
      else setLocation("/dashboard");
    }, 1200);
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) {
      const el = document.getElementById(`otp-${i + 1}`);
      el?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: isDark
          ? "linear-gradient(135deg, hsl(135,20%,2%) 0%, hsl(135,25%,4%) 50%, hsl(135,20%,2%) 100%)"
          : "linear-gradient(135deg, #f0faf4 0%, #e6f7ed 50%, #f0faf4 100%)",
      }}>

      {/* Background watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <img src="/goat-logo.png" alt="" className="w-96 h-96 object-contain opacity-[0.03]" style={{ filter: "blur(2px)" }} />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${isDark ? "rgba(0,230,118,0.025)" : "rgba(0,180,80,0.04)"} 1px, transparent 1px),
            linear-gradient(90deg, ${isDark ? "rgba(0,230,118,0.025)" : "rgba(0,180,80,0.04)"} 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,230,118,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,230,118,0.05) 0%, transparent 70%)", filter: "blur(60px)" }} />

      {/* Card */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden"
        style={{
          background: isDark ? "rgba(5,20,10,0.92)" : "rgba(255,255,255,0.95)",
          border: `1px solid ${isDark ? "rgba(0,230,118,0.2)" : "rgba(0,180,80,0.15)"}`,
          boxShadow: isDark
            ? "0 0 60px rgba(0,230,118,0.08), 0 24px 64px rgba(0,0,0,0.6)"
            : "0 24px 64px rgba(0,0,0,0.1)",
          backdropFilter: "blur(20px)",
        }}>
        <div className="p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <img src="/goat-logo.png" alt="GOAT-PAY" className="w-16 h-16 object-contain mb-3"
              style={{ filter: "drop-shadow(0 0 12px rgba(0,230,118,0.6))" }} />
            <span className="text-2xl font-black tracking-widest" style={{ color: "#00e676", textShadow: "0 0 16px rgba(0,230,118,0.5)" }}>
              GOAT-PAY
            </span>
            <p className="text-xs mt-1" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
              Plataforma Premium de Pagamentos
            </p>
          </div>

          {/* Mode titles */}
          {mode === "login" && (
            <h2 className="text-xl font-bold mb-6 text-center" style={{ color: isDark ? "#fff" : "#111" }}>
              Entrar na sua conta
            </h2>
          )}
          {mode === "register" && (
            <h2 className="text-xl font-bold mb-6 text-center" style={{ color: isDark ? "#fff" : "#111" }}>
              Criar conta grátis
            </h2>
          )}
          {mode === "forgot" && (
            <h2 className="text-xl font-bold mb-2 text-center" style={{ color: isDark ? "#fff" : "#111" }}>
              Recuperar senha
            </h2>
          )}
          {mode === "verify" && (
            <h2 className="text-xl font-bold mb-2 text-center" style={{ color: isDark ? "#fff" : "#111" }}>
              Verifique seu e-mail
            </h2>
          )}
          {mode === "2fa" && (
            <h2 className="text-xl font-bold mb-2 text-center" style={{ color: isDark ? "#fff" : "#111" }}>
              Autenticação em 2 etapas
            </h2>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <InputField
                icon={<User className="w-4 h-4" />}
                type="text" placeholder="Seu nome completo"
                value={name} onChange={setName}
                isDark={isDark}
              />
            )}
            {(mode === "login" || mode === "register" || mode === "forgot") && (
              <InputField
                icon={<Mail className="w-4 h-4" />}
                type="email" placeholder="seu@email.com"
                value={email} onChange={setEmail}
                isDark={isDark}
              />
            )}
            {(mode === "login" || mode === "register") && (
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                    color: isDark ? "#fff" : "#111",
                  }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {mode === "verify" && (
              <div className="text-center space-y-4">
                <p className="text-sm" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
                  Enviamos um link de verificação para <strong style={{ color: "#00e676" }}>{email || "seu@email.com"}</strong>
                </p>
                <p className="text-xs" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>
                  Verifique sua caixa de entrada e spam.
                </p>
              </div>
            )}

            {mode === "2fa" && (
              <div className="space-y-3">
                <p className="text-sm text-center" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
                  Digite o código de 6 dígitos do seu app autenticador
                </p>
                <div className="flex gap-2 justify-center">
                  {otp.map((val, i) => (
                    <input
                      key={i} id={`otp-${i}`}
                      type="text" inputMode="numeric" maxLength={1}
                      value={val} onChange={(e) => handleOtpChange(i, e.target.value)}
                      className="w-11 h-14 text-center text-xl font-bold rounded-xl outline-none transition-all"
                      style={{
                        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                        border: `1.5px solid ${val ? "#00e676" : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                        color: isDark ? "#fff" : "#111",
                        boxShadow: val ? "0 0 8px rgba(0,230,118,0.3)" : "none",
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 justify-center text-xs" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#00e676" }} />
                  Protegido com 2FA
                </div>
              </div>
            )}

            {mode === "login" && (
              <div className="flex justify-end">
                <button type="button" onClick={() => setMode("forgot")}
                  className="text-xs font-medium" style={{ color: "#00e676" }}>
                  Esqueci minha senha
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
              style={{
                background: "linear-gradient(135deg, #00e676, #00c853)",
                color: "#000",
                boxShadow: "0 0 20px rgba(0,230,118,0.4)",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "login" && "Entrar"}
                  {mode === "register" && "Criar conta"}
                  {mode === "forgot" && "Enviar link de recuperação"}
                  {mode === "verify" && "Já verifiquei meu e-mail"}
                  {mode === "2fa" && "Confirmar"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social logins */}
          {(mode === "login" || mode === "register") && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
                <span className="text-xs" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>ou continue com</span>
                <div className="flex-1 h-px" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <Chrome className="w-4 h-4" />, label: "Google" },
                  { icon: <Apple className="w-4 h-4" />, label: "Apple" },
                  { icon: <Facebook className="w-4 h-4" />, label: "Facebook" },
                ].map((s) => (
                  <button key={s.label}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                      color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
                    }}>
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Mode switcher */}
          <div className="mt-6 text-center text-sm" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
            {mode === "login" && (
              <>Não tem conta?{" "}
                <button onClick={() => setMode("register")} className="font-semibold" style={{ color: "#00e676" }}>
                  Criar grátis
                </button>
              </>
            )}
            {mode === "register" && (
              <>Já tem conta?{" "}
                <button onClick={() => setMode("login")} className="font-semibold" style={{ color: "#00e676" }}>
                  Entrar
                </button>
              </>
            )}
            {(mode === "forgot" || mode === "verify" || mode === "2fa") && (
              <button onClick={() => setMode("login")} className="font-semibold" style={{ color: "#00e676" }}>
                ← Voltar ao login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ icon, type, placeholder, value, onChange, isDark }: {
  icon: React.ReactNode; type: string; placeholder: string;
  value: string; onChange: (v: string) => void; isDark: boolean;
}) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
        {icon}
      </div>
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
        style={{
          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
          color: isDark ? "#fff" : "#111",
        }}
      />
    </div>
  );
}
