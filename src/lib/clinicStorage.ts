// Chaves de localStorage para dados visuais da clínica (logo e cor).
// Centralizadas aqui para evitar duplicação entre Perfil, DocumentosPDF e OnboardingFlow.
export const COR_CLINICA_KEY  = (uid: string) => `gestclini_cor_clinica_${uid}`;
export const LOGO_CLINICA_KEY = (uid: string) => `perfil_avatar_${uid}`;
