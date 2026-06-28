import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Chrome, Apple, Facebook, ShieldCheck, Sparkles } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

type AuthMode = "login" | "register" | "forgot" | "verify" | "2fa";

/* ─── Particle canvas ─── */
function ParticleCanvas({ isDark }: { isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const PARTICLE_COUNT = 70;
    type P = { x: number; y: number; vx: number; vy: number; r: number; o: number; pulse: number };
    const particles: P[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2.5 + 0.5,
      o: Math.random() * 0.5 + 0.1,
      pulse: Math.random() * Math.PI * 2,
    }));

    const neonRgb = isDark ? "0,230,118" : "0,168,79";

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = Date.now() * 0.001;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.02;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const alpha = p.o * (0.7 + 0.3 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${neonRgb},${alpha})`;
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${neonRgb},${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Ambient glow orbs
      const orbs = [
        { x: canvas.width * 0.15, y: canvas.height * 0.2, r: 200 },
        { x: canvas.width * 0.85, y: canvas.height * 0.8, r: 250 },
        { x: canvas.width * 0.5, y: canvas.height * 0.5, r: 300 },
      ];
      orbs.forEach((orb, i) => {
        const pulse = 0.04 * Math.sin(t * 0.5 + i * 2);
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r * (1 + pulse));
        const baseAlpha = isDark ? 0.06 : 0.04;
        grad.addColorStop(0, `rgba(${neonRgb},${baseAlpha})`);
        grad.addColorStop(1, `rgba(${neonRgb},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r * (1 + pulse), 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [isDark]);

  return (
    <canvas ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }} />
  );
}

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

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

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center"
      style={{
        background: isDark
          ? "radial-gradient(ellipse at 20% 30%, hsl(145,30%,3%) 0%, hsl(135,25%,2%) 50%, hsl(145,20%,2%) 100%)"
          : "radial-gradient(ellipse at 20% 30%, #e8f7ee 0%, #f0f8f3 50%, #eaf7f0 100%)",
      }}>
      {/* Particle canvas */}
      <ParticleCanvas isDark={isDark} />

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1,
        backgroundImage: `linear-gradient(${isDark ? "rgba(0,230,118,0.018)" : "rgba(0,180,70,0.03)"} 1px, transparent 1px),
          linear-gradient(90deg, ${isDark ? "rgba(0,230,118,0.018)" : "rgba(0,180,70,0.03)"} 1px, transparent 1px)`,
        backgroundSize: "50px 50px" }} />

      {/* ─── GIANT LOGO BACKGROUND WATERMARK ─── */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none select-none" style={{ zIndex: 1 }}>
        <div className="relative">
          <img src="/goat-logo.png" alt=""
            className="object-contain"
            style={{
              width: "min(60vw, 60vh)",
              height: "min(60vw, 60vh)",
              opacity: isDark ? 0.04 : 0.06,
              filter: isDark ? "blur(1px) drop-shadow(0 0 60px rgba(0,230,118,0.3))" : "blur(1px)",
              transform: "scale(1.05)",
            }} />
        </div>
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center w-full px-4" style={{ zIndex: 10 }}>
        {/* Top branding */}
        <div className={`flex flex-col items-center mb-8 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"}`}>
          <div className="relative mb-4">
            <img src="/goat-logo.png" alt="GOAT-PAY"
              className="w-24 h-24 object-contain"
              style={{
                filter: isDark
                  ? "drop-shadow(0 0 24px rgba(0,230,118,0.9)) drop-shadow(0 0 60px rgba(0,230,118,0.4))"
                  : "drop-shadow(0 0 16px rgba(0,168,79,0.5))",
              }} />
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-full animate-ping"
              style={{ background: `radial-gradient(circle, ${neon}15, transparent 70%)`, animationDuration: "3s" }} />
          </div>
          <h1 className="text-5xl font-black tracking-[0.2em]"
            style={{
              color: neon,
              textShadow: isDark
                ? `0 0 20px ${neon}80, 0 0 60px ${neon}30`
                : `0 2px 20px ${neon}40`,
              letterSpacing: "0.22em",
            }}>
            GOAT-PAY
          </h1>
          <p className="text-sm mt-2 font-medium tracking-widest uppercase"
            style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)", letterSpacing: "0.25em" }}>
            A Plataforma que Domina o Mercado
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }}>
            <Sparkles className="w-3 h-3" style={{ color: neon + "80" }} />
            <span>Pagamentos. Produtos. Performance.</span>
            <Sparkles className="w-3 h-3" style={{ color: neon + "80" }} />
          </div>
        </div>

        {/* ─── GLASS CARD ─── */}
        <div className={`w-full max-w-[420px] rounded-2xl overflow-hidden transition-all duration-700 delay-100
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          style={{
            background: isDark
              ? "rgba(5,18,10,0.75)"
              : "rgba(255,255,255,0.80)",
            border: `1px solid ${isDark ? "rgba(0,230,118,0.2)" : "rgba(0,168,79,0.15)"}`,
            boxShadow: isDark
              ? `0 0 0 1px rgba(0,230,118,0.05) inset, 0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(0,230,118,0.06)`
              : `0 32px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,168,79,0.08) inset`,
            backdropFilter: "blur(24px)",
          }}>
          {/* Top green accent line */}
          <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${neon}, transparent)` }} />

          <div className="p-7">
            {/* Mode header */}
            <div className="mb-6 text-center">
              <h2 className="text-lg font-bold"
                style={{ color: isDark ? "#fff" : "#111" }}>
                {mode === "login" && "Bem-vindo de volta"}
                {mode === "register" && "Criar conta gratuita"}
                {mode === "forgot" && "Recuperar acesso"}
                {mode === "verify" && "Verificar e-mail"}
                {mode === "2fa" && "Verificação em 2 etapas"}
              </h2>
              <p className="text-xs mt-1" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>
                {mode === "login" && "Entre na sua conta GOAT-PAY"}
                {mode === "register" && "Comece a vender em minutos"}
                {mode === "forgot" && "Insira seu e-mail para redefinir"}
                {mode === "verify" && "Verifique sua caixa de entrada"}
                {mode === "2fa" && "Digite o código do seu autenticador"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "register" && (
                <GlassInput icon={<User className="w-4 h-4" />} type="text"
                  placeholder="Nome completo" value={name} onChange={setName} isDark={isDark} neon={neon} />
              )}
              {(mode === "login" || mode === "register" || mode === "forgot") && (
                <GlassInput icon={<Mail className="w-4 h-4" />} type="email"
                  placeholder="seu@email.com" value={email} onChange={setEmail} isDark={isDark} neon={neon} />
              )}
              {(mode === "login" || mode === "register") && (
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
                    <Lock className="w-4 h-4" />
                  </div>
                  <input type={showPass ? "text" : "password"} placeholder="Senha" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}`,
                      color: isDark ? "#fff" : "#111",
                    }}
                    onFocus={(e) => (e.target.style.border = `1px solid ${neon}60`)}
                    onBlur={(e) => (e.target.style.border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}`)} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {mode === "verify" && (
                <div className="py-4 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                    style={{ background: `${neon}15`, border: `1px solid ${neon}30` }}>
                    <Mail className="w-6 h-6" style={{ color: neon }} />
                  </div>
                  <p className="text-sm" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
                    Enviamos um link para{" "}
                    <strong style={{ color: neon }}>{email || "seu@email.com"}</strong>
                  </p>
                  <p className="text-xs" style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)" }}>
                    Verifique também o spam.
                  </p>
                </div>
              )}

              {mode === "2fa" && (
                <div className="py-2 space-y-4">
                  <div className="flex gap-2 justify-center">
                    {otp.map((val, i) => (
                      <input key={i} id={`otp-${i}`} type="text" inputMode="numeric"
                        maxLength={1} value={val}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        className="w-11 h-14 text-center text-xl font-bold rounded-xl outline-none transition-all"
                        style={{
                          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                          border: `1.5px solid ${val ? neon : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                          color: isDark ? "#fff" : "#111",
                          boxShadow: val ? `0 0 10px ${neon}40` : "none",
                        }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 justify-center text-xs"
                    style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)" }}>
                    <ShieldCheck className="w-3.5 h-3.5" style={{ color: neon }} />
                    Proteção avançada ativa
                  </div>
                </div>
              )}

              {mode === "login" && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => setMode("forgot")}
                    className="text-xs font-medium" style={{ color: neon }}>
                    Esqueci minha senha
                  </button>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all duration-200 mt-1"
                style={{
                  background: `linear-gradient(135deg, ${neon}, color-mix(in srgb, ${neon} 80%, black))`,
                  color: "#000", letterSpacing: "0.05em",
                  boxShadow: `0 0 24px ${neon}50, 0 4px 16px rgba(0,0,0,0.3)`,
                  opacity: loading ? 0.75 : 1,
                  transform: loading ? "scale(0.98)" : "scale(1)",
                }}
                onMouseEnter={(e) => !loading && ((e.target as HTMLElement).style.transform = "scale(1.02)")}
                onMouseLeave={(e) => !loading && ((e.target as HTMLElement).style.transform = "scale(1)")}>
                {loading ? (
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === "login" && "ENTRAR"}
                    {mode === "register" && "CRIAR CONTA"}
                    {mode === "forgot" && "ENVIAR LINK"}
                    {mode === "verify" && "JÁ VERIFIQUEI"}
                    {mode === "2fa" && "CONFIRMAR"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Social auth */}
            {(mode === "login" || mode === "register") && (
              <>
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px"
                    style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)" }} />
                  <span className="text-xs" style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)" }}>
                    ou continue com
                  </span>
                  <div className="flex-1 h-px"
                    style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)" }} />
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { icon: <Chrome className="w-4 h-4" />, label: "Google" },
                    { icon: <Apple className="w-4 h-4" />, label: "Apple" },
                    { icon: <Facebook className="w-4 h-4" />, label: "Facebook" },
                  ].map((s) => (
                    <button key={s.label}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}`,
                        color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
                        (e.currentTarget as HTMLElement).style.border = `1px solid ${neon}40`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
                        (e.currentTarget as HTMLElement).style.border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}`;
                      }}>
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Mode switch */}
            <div className="mt-5 text-center text-xs" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)" }}>
              {mode === "login" && (
                <>Não tem conta?{" "}
                  <button onClick={() => setMode("register")} className="font-bold" style={{ color: neon }}>
                    Criar grátis
                  </button>
                </>
              )}
              {mode === "register" && (
                <>Já tem conta?{" "}
                  <button onClick={() => setMode("login")} className="font-bold" style={{ color: neon }}>
                    Entrar
                  </button>
                </>
              )}
              {(mode === "forgot" || mode === "verify" || mode === "2fa") && (
                <button onClick={() => setMode("login")} className="font-bold" style={{ color: neon }}>
                  ← Voltar ao login
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className={`mt-6 text-xs transition-all duration-700 delay-300 ${mounted ? "opacity-100" : "opacity-0"}`}
          style={{ color: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.2)" }}>
          © 2026 GOAT-PAY · Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}

function GlassInput({ icon, type, placeholder, value, onChange, isDark, neon }: {
  icon: React.ReactNode; type: string; placeholder: string;
  value: string; onChange: (v: string) => void; isDark: boolean; neon: string;
}) {
  const defaultBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
        {icon}
      </div>
      <input type={type} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
        style={{
          background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
          border: `1px solid ${defaultBorder}`,
          color: isDark ? "#fff" : "#111",
        }}
        onFocus={(e) => (e.target.style.border = `1px solid ${neon}60`)}
        onBlur={(e) => (e.target.style.border = `1px solid ${defaultBorder}`)} />
    </div>
  );
}
