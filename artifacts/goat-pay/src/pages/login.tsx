import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  Eye, EyeOff, Mail, Lock, User, Phone, Calendar,
  ArrowRight, Chrome, Apple, Facebook, ShieldCheck,
  TrendingUp, Zap, Globe, Check,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

type AuthMode = "login" | "register" | "forgot" | "verify" | "2fa";

/* ─── Animated particle canvas (left panel) ─── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const neonRgb = "0,230,118";
    const count = 55;
    type P = { x: number; y: number; vx: number; vy: number; r: number; phase: number };
    const pts: P[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 0.5,
      phase: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = Date.now() * 0.001;

      pts.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.phase += 0.018;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        const a = 0.12 + 0.08 * Math.sin(p.phase);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${neonRgb},${a})`;
        ctx.fill();
      });

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 90) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${neonRgb},${0.06 * (1 - d / 90)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }

      // Ambient glow orbs
      [[0.2, 0.25, 180], [0.8, 0.75, 220], [0.5, 0.5, 260]].forEach(([rx, ry, rr], i) => {
        const pulse = 1 + 0.05 * Math.sin(t * 0.4 + i * 2);
        const cx = rx * canvas.width, cy = ry * canvas.height;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, (rr as number) * pulse);
        g.addColorStop(0, `rgba(${neonRgb},0.05)`);
        g.addColorStop(1, `rgba(${neonRgb},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, (rr as number) * pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }} />;
}

const BENEFITS = [
  { icon: <TrendingUp className="w-4 h-4" />, text: "Sem taxas mensais — pague só ao vender" },
  { icon: <Zap className="w-4 h-4" />, text: "Pagamentos automáticos e instantâneos" },
  { icon: <Globe className="w-4 h-4" />, text: "PIX, Cartão, Boleto e Carteiras digitais" },
  { icon: <ShieldCheck className="w-4 h-4" />, text: "Segurança antifraude de nível bancário" },
];

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", birthDate: "", password: "",
  });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [agreed, setAgreed] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  const isDark = theme === "dark";
  const neon = isDark ? "#00e676" : "#00a84f";

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

  const handleOtp = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  /* ─── shared field style ─── */
  const field = (extra?: React.CSSProperties): React.CSSProperties => ({
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"}`,
    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
    color: isDark ? "#fff" : "#111",
    fontSize: 14,
    outline: "none",
    transition: "border 0.2s",
    ...extra,
  });

  const focusBorder = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.border = `1px solid ${neon}70`);
  const blurBorder = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.border = `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"}`);

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5,
    color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)",
    letterSpacing: "0.03em",
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row"
      style={{ background: isDark ? "#030d06" : "#f4f8f5" }}>

      {/* ═══════════════════════════════════════════
          LEFT PANEL — Branding
      ═══════════════════════════════════════════ */}
      <div className="relative lg:w-[52%] flex flex-col overflow-hidden"
        style={{
          background: isDark
            ? "radial-gradient(ellipse at 30% 40%, #061a0c 0%, #030a05 100%)"
            : "radial-gradient(ellipse at 30% 40%, #e6f4ec 0%, #d5edde 100%)",
          minHeight: "280px",
        }}>
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(${isDark ? "rgba(0,230,118,0.025)" : "rgba(0,168,79,0.04)"} 1px, transparent 1px),
            linear-gradient(90deg, ${isDark ? "rgba(0,230,118,0.025)" : "rgba(0,168,79,0.04)"} 1px, transparent 1px)`,
          backgroundSize: "42px 42px",
          zIndex: 0,
        }} />

        <ParticleCanvas />

        {/* Giant watermark logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ zIndex: 1 }}>
          <img src="/goat-logo.png" alt=""
            style={{
              width: "min(55vw, 420px)", height: "min(55vw, 420px)",
              objectFit: "contain",
              opacity: isDark ? 0.05 : 0.07,
              filter: "blur(0.5px)",
            }} />
        </div>

        {/* Content */}
        <div className="relative flex flex-col h-full px-10 py-10 justify-between" style={{ zIndex: 2 }}>
          {/* Logo top */}
          <div className="flex items-center gap-3">
            <img src="/goat-logo.png" alt="GOAT-PAY"
              className="w-10 h-10 object-contain"
              style={{ filter: isDark ? `drop-shadow(0 0 12px ${neon}90)` : `drop-shadow(0 0 8px ${neon}60)` }} />
            <span className="text-xl font-black tracking-widest" style={{ color: neon, letterSpacing: "0.18em" }}>
              GOAT-PAY
            </span>
          </div>

          {/* Main message */}
          <div className="py-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: `${neon}80`, letterSpacing: "0.22em" }}>
              Para Criadores Digitais
            </p>
            <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-6"
              style={{ color: isDark ? "#fff" : "#0d2a16" }}>
              Transforme seu{" "}
              <span style={{
                color: neon,
                textShadow: isDark ? `0 0 30px ${neon}50` : "none",
              }}>
                talento
              </span>
              {" "}em renda.
            </h1>
            <p className="text-base leading-relaxed mb-8"
              style={{ color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)", maxWidth: 380 }}>
              Venda cursos, mentorias, e-books e produtos digitais com entrega automática e pagamentos instantâneos.
            </p>

            {/* Benefits */}
            <div className="space-y-3">
              {BENEFITS.map((b) => (
                <div key={b.text} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${neon}18`, border: `1px solid ${neon}30`, color: neon }}>
                    {b.icon}
                  </div>
                  <span className="text-sm" style={{ color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" }}>
                    {b.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom — payment methods icons placeholder */}
          <div className="flex flex-wrap gap-2 items-center">
            {["PIX", "Visa", "MC", "Boleto", "G Pay"].map((m) => (
              <div key={m} className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{
                  background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                  color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                }}>
                {m}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          RIGHT PANEL — Form
      ═══════════════════════════════════════════ */}
      <div className="lg:w-[48%] flex flex-col items-center justify-center px-6 py-12 overflow-y-auto"
        style={{ background: isDark ? "#07130a" : "#fff" }}>

        <div className={`w-full max-w-[420px] transition-all duration-600 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>

          {/* Title */}
          <div className="mb-7">
            <h2 className="text-2xl font-extrabold" style={{ color: isDark ? "#fff" : "#111" }}>
              {mode === "login" && "Bem-vindo de volta"}
              {mode === "register" && "Crie sua conta"}
              {mode === "forgot" && "Recuperar acesso"}
              {mode === "verify" && "Verifique seu e-mail"}
              {mode === "2fa" && "Verificação em 2 etapas"}
            </h2>
            <p className="text-sm mt-1.5">
              {mode === "login" && (
                <span style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)" }}>
                  Não tem conta?{" "}
                  <button onClick={() => setMode("register")} className="font-semibold" style={{ color: neon }}>
                    Criar grátis
                  </button>
                </span>
              )}
              {mode === "register" && (
                <span style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)" }}>
                  Já tem conta?{" "}
                  <button onClick={() => setMode("login")} className="font-semibold" style={{ color: neon }}>
                    Fazer login
                  </button>
                </span>
              )}
              {(mode === "forgot" || mode === "verify" || mode === "2fa") && (
                <button onClick={() => setMode("login")} className="font-semibold" style={{ color: neon }}>
                  ← Voltar ao login
                </button>
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ─ REGISTER fields ─ */}
            {mode === "register" && (
              <>
                {/* Nome + Sobrenome */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={labelStyle}>NOME</label>
                    <input type="text" placeholder="Seu nome" value={form.firstName} onChange={set("firstName")}
                      style={field()} onFocus={focusBorder} onBlur={blurBorder} />
                  </div>
                  <div>
                    <label style={labelStyle}>SOBRENOME</label>
                    <input type="text" placeholder="Sobrenome" value={form.lastName} onChange={set("lastName")}
                      style={field()} onFocus={focusBorder} onBlur={blurBorder} />
                  </div>
                </div>
                <p className="text-xs flex items-center gap-1.5 -mt-1"
                  style={{ color: `${neon}80` }}>
                  <Check className="w-3 h-3" />
                  Use o nome exatamente como no seu documento de identificação.
                </p>

                {/* Data de nascimento + Telefone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={labelStyle}>DATA DE NASCIMENTO</label>
                    <div className="relative">
                      <input type="text" placeholder="DD / MM / AAAA" value={form.birthDate} onChange={set("birthDate")}
                        style={field({ paddingLeft: 36 })} onFocus={focusBorder} onBlur={blurBorder} />
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>TELEFONE</label>
                    <div className="relative">
                      <input type="tel" placeholder="(11) 91234-5678" value={form.phone} onChange={set("phone")}
                        style={field({ paddingLeft: 36 })} onFocus={focusBorder} onBlur={blurBorder} />
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            {(mode === "login" || mode === "register" || mode === "forgot") && (
              <div>
                <label style={labelStyle}>E-MAIL</label>
                <div className="relative">
                  <input type="email" placeholder="seu@email.com" value={form.email} onChange={set("email")}
                    style={field({ paddingLeft: 36 })} onFocus={focusBorder} onBlur={blurBorder} />
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }} />
                </div>
              </div>
            )}

            {/* Password */}
            {(mode === "login" || mode === "register") && (
              <div>
                <label style={labelStyle}>SENHA</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} placeholder="Mínimo 8 caracteres"
                    value={form.password} onChange={set("password")}
                    style={field({ paddingLeft: 36, paddingRight: 40 })}
                    onFocus={focusBorder} onBlur={blurBorder} />
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === "login" && (
                  <div className="flex justify-end mt-1.5">
                    <button type="button" onClick={() => setMode("forgot")}
                      className="text-xs font-medium" style={{ color: neon }}>
                      Esqueci minha senha
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Verify mode */}
            {mode === "verify" && (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                  style={{ background: `${neon}12`, border: `1px solid ${neon}25` }}>
                  <Mail className="w-7 h-7" style={{ color: neon }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: isDark ? "#fff" : "#111" }}>
                    Enviamos um link para
                  </p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: neon }}>
                    {form.email || "seu@email.com"}
                  </p>
                </div>
                <p className="text-xs" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)" }}>
                  Verifique também a pasta de spam.
                </p>
              </div>
            )}

            {/* 2FA mode */}
            {mode === "2fa" && (
              <div className="py-4 space-y-5">
                <div className="flex gap-2 justify-center">
                  {otp.map((val, i) => (
                    <input key={i} id={`otp-${i}`} type="text" inputMode="numeric"
                      maxLength={1} value={val} onChange={(e) => handleOtp(i, e.target.value)}
                      className="w-11 h-14 text-center text-xl font-bold rounded-xl outline-none transition-all"
                      style={{
                        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                        border: `2px solid ${val ? neon : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                        color: isDark ? "#fff" : "#111",
                        boxShadow: val ? `0 0 14px ${neon}35` : "none",
                      }} />
                  ))}
                </div>
                <p className="text-center text-xs flex items-center justify-center gap-1.5"
                  style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)" }}>
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: neon }} />
                  Autenticação de dois fatores ativa
                </p>
              </div>
            )}

            {/* Terms checkbox (register only) */}
            {mode === "register" && (
              <label className="flex items-start gap-2.5 cursor-pointer">
                <div className="relative mt-0.5 shrink-0">
                  <input type="checkbox" className="sr-only" checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)} />
                  <div className="w-4 h-4 rounded flex items-center justify-center transition-all"
                    style={{
                      background: agreed ? neon : "transparent",
                      border: `1.5px solid ${agreed ? neon : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`,
                    }}>
                    {agreed && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                  </div>
                </div>
                <span className="text-xs leading-relaxed"
                  style={{ color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)" }}>
                  Concordo com os{" "}
                  <a href="#" className="font-semibold" style={{ color: neon }}>Termos de Uso</a>
                  {" "}e a{" "}
                  <a href="#" className="font-semibold" style={{ color: neon }}>Política de Privacidade</a>
                  {" "}da GOAT-PAY
                </span>
              </label>
            )}

            {/* CTA button */}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all duration-150 mt-1"
              style={{
                background: `linear-gradient(135deg, ${neon} 0%, color-mix(in srgb, ${neon} 75%, black) 100%)`,
                color: "#000",
                boxShadow: `0 0 24px ${neon}45, 0 4px 16px rgba(0,0,0,0.25)`,
                opacity: loading ? 0.75 : 1,
                transform: loading ? "scale(0.98)" : "scale(1)",
                letterSpacing: "0.06em",
              }}>
              {loading
                ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                : <>
                  {mode === "login" && "ENTRAR"}
                  {mode === "register" && "CRIAR MINHA CONTA"}
                  {mode === "forgot" && "ENVIAR LINK DE ACESSO"}
                  {mode === "verify" && "JÁ VERIFIQUEI"}
                  {mode === "2fa" && "CONFIRMAR ACESSO"}
                  <ArrowRight className="w-4 h-4" />
                </>
              }
            </button>
          </form>

          {/* Social auth */}
          {(mode === "login" || mode === "register") && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)" }} />
                <span className="text-xs" style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)" }}>
                  ou continue com
                </span>
                <div className="flex-1 h-px" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)" }} />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { icon: <Chrome className="w-4 h-4" />, label: "Google" },
                  { icon: <Apple className="w-4 h-4" />, label: "Apple" },
                  { icon: <Facebook className="w-4 h-4" />, label: "Facebook" },
                ].map((s) => (
                  <button key={s.label}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.1)"}`,
                      color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = `${neon}50`;
                      (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(0,230,118,0.06)" : "rgba(0,168,79,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.1)";
                      (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
                    }}>
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Footer */}
          <p className="text-center text-xs mt-8"
            style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)" }}>
            © 2026 GOAT-PAY · Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
