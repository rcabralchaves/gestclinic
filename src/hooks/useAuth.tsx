import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Só liberamos o app (loading = false) depois que a sessão inicial do
  // Supabase (getSession) terminar de carregar. Isso evita a race condition
  // em que os hooks de dados (usePlano, useSupabaseTable) disparavam
  // consultas antes do token de sessão estar disponível, fazendo as
  // queries saírem como se fossem anônimas.
  const initialSessionLoadedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      initialSessionLoadedRef.current = true;
      setSession(session);
      setLoading(false);
    }).catch((error) => {
      console.error("useAuth: erro ao carregar sessão inicial do Supabase:", error);
      if (!mounted) return;
      initialSessionLoadedRef.current = true;
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Adiamos a atualização de estado para fora do callback síncrono
        // do GoTrue (recomendação oficial da Supabase), evitando condições
        // de corrida com o próprio cliente Supabase.
        setTimeout(() => {
          if (!mounted) return;
          setSession(session);
          // Só marcamos loading = false aqui se a checagem inicial já
          // tiver concluído, para não liberar o app antes da hora.
          if (initialSessionLoadedRef.current) {
            setLoading(false);
          }
        }, 0);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
