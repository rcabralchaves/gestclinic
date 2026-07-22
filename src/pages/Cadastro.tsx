import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, CheckCircle2, Crown, AlertCircle, Info } from "lucide-react";

const planos = [
  {
    id: "basico" as const,
    nome: "Básico",
    preco: "R$ 59,90/mês",
    features: ["Agenda", "Prontuário eletrônico", "Visualização de pacientes", "Suporte por e-mail"],
  },
  {
    id: "completo" as const,
    nome: "Completo",
    preco: "R$ 89,90/mês",
    features: ["Agenda completa", "Prontuário eletrônico", "Financeiro completo", "Estoque", "Relatórios avançados", "Suporte prioritário"],
    destaque: true,
  },
];

type ErrorState = { type: "email_exists" | "weak_password" | "generic"; message: string } | null;

export default function Cadastro() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState<"basico" | "completo">("completo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState>(null);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError({ type: "generic", message: "As senhas digitadas não são iguais." });
      return;
    }

    if (password.length < 8) {
      setError({ type: "weak_password", message: "A senha deve ter pelo menos 8 caracteres, incluindo letras e números." });
      return;
    }

    setLoading(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      const msg = signUpError.message || "";
      const code = (signUpError as any)?.code || "";

      if (
        msg.includes("already registered") ||
        msg.includes("already exists") ||
        code === "user_already_exists"
      ) {
        setError({ type: "email_exists", message: "Este e-mail já possui uma conta no GestClini." });
      } else if (
        msg.includes("weak_password") ||
        msg.includes("pwned") ||
        code === "weak_password"
      ) {
        setError({
          type: "weak_password",
          message: "Esta senha foi encontrada em vazamentos de dados e não pode ser usada. Escolha uma senha diferente — tente combinar palavras, números e símbolos que só você conhece.",
        });
      } else {
        setError({ type: "generic", message: msg || "Não foi possível criar a conta. Tente novamente." });
      }
      setLoading(false);
      return;
    }

    // Supabase returns no error but empty identities when email already exists
    if (!signUpData.user || (signUpData.user.identities && signUpData.user.identities.length === 0)) {
      setError({ type: "email_exists", message: "Este e-mail já possui uma conta no GestClini." });
      setLoading(false);
      return;
    }

    if (signUpData.user) {
      await supabase.from("profiles" as any).insert({
        user_id:          signUpData.user.id,
        nome:             email.split("@")[0] || "",
        email:            email,
        plano:            planoSelecionado,
        onboarding_step:  0,   // inicia onboarding na primeira entrada
      } as any);
    }

    navigate("/dashboard", { replace: true });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">G</span>
            </div>
            <span className="font-heading font-bold text-2xl">GestClini</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Criar conta</CardTitle>
            <CardDescription>Escolha seu plano e comece agora</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignUp}>
            <CardContent className="space-y-5">
              {/* Error banner */}
              {error && (
                <div className={`rounded-lg border p-3.5 flex gap-3 items-start text-sm ${
                  error.type === "email_exists"
                    ? "bg-blue-50 border-blue-200 text-blue-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}>
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p>{error.message}</p>
                    {error.type === "email_exists" && (
                      <p>
                        <Link to="/login" className="font-semibold underline underline-offset-2">
                          Clique aqui para entrar na sua conta
                        </Link>
                      </p>
                    )}
                    {error.type === "weak_password" && (
                      <p className="text-xs opacity-80">
                        Dica: use pelo menos 8 caracteres com letras maiúsculas, minúsculas, números e um símbolo (ex: @, #, !).
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Plan selection */}
              <div className="space-y-2">
                <Label>Escolha seu plano</Label>
                <div className="grid grid-cols-2 gap-3">
                  {planos.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlanoSelecionado(p.id)}
                      className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                        planoSelecionado === p.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      {p.destaque && (
                        <div className="absolute -top-2.5 right-2 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Crown className="h-3 w-3" /> Recomendado
                        </div>
                      )}
                      <div className="font-heading font-semibold text-sm">{p.nome}</div>
                      <div className="text-primary font-bold text-lg mt-1">{p.preco}</div>
                      <ul className="mt-2 space-y-1">
                        {p.features.map((f) => (
                          <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>Use letras maiúsculas, minúsculas, números e símbolos para uma senha segura.</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Criando conta..." : "Criar conta"}
              </Button>
              <p className="text-sm text-muted-foreground">
                Já tem conta?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Entrar
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
