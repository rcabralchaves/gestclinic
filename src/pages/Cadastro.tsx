import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CheckCircle2, Crown } from "lucide-react";

const planos = [
  {
    id: "basico" as const,
    nome: "Básico",
    preco: "R$ 37/mês",
    features: ["Controle financeiro", "Relatórios simples", "Visualização de pacientes"],
  },
  {
    id: "completo" as const,
    nome: "Completo",
    preco: "R$ 67/mês",
    features: ["Agenda completa", "Prontuário eletrônico", "Financeiro completo", "Estoque", "Relatórios avançados"],
    destaque: true,
  },
];

export default function Cadastro() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState<"basico" | "completo">("completo");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Senhas não conferem", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { data: signUpData, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      let description = error.message;
      if (error.message?.includes("weak_password") || error.message?.includes("pwned") || (error as any)?.code === "weak_password") {
        description = "A senha escolhida é muito fraca ou já foi exposta em vazamentos de dados. Escolha uma senha mais forte e única.";
      }
      toast({
        title: "Erro ao criar conta",
        description,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Create profile with selected plan
    if (signUpData.user) {
      await supabase.from("profiles" as any).insert({
        user_id: signUpData.user.id,
        nome: email.split("@")[0] || "",
        email: email,
        plano: planoSelecionado,
      } as any);
    }

    toast({ title: "Conta criada com sucesso!" });
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
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
