import { ApiError } from "@/lib/api/types";

const ERROR_MESSAGES: Record<string, string> = {
  ACCOUNT_BLOCKED: "Votre compte est suspendu. Contactez le support pour plus d'informations.",
  ALREADY_ANSWERED: "Cette demande a déjà reçu une réponse.",
  CATEGORY_EXISTS: "Une catégorie avec ce nom ou ce slug existe déjà.",
  EMAIL_EXISTS: "Un compte avec cet e-mail existe déjà.",
  FORBIDDEN: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
  FULL: "Cette partie est déjà complète.",
  INVALID_CATEGORY: "La catégorie sélectionnée est invalide.",
  INVALID_CREDENTIALS: "E-mail ou mot de passe incorrect.",
  INVALID_STATUS_TRANSITION: "Ce changement de statut n'est pas autorisé.",
  PACK_EXISTS: "Un pack avec ce nom existe déjà.",
  POST_CLOSED: "Cette annonce n'est plus ouverte.",
  RATE_LIMIT: "Trop de tentatives. Réessayez dans quelques instants.",
  REQUEST_EXISTS: "Vous avez déjà envoyé une demande pour cette partie.",
  RESOURCE_EXISTS: "Une ressource avec ce nom existe déjà.",
  SLOT_ALREADY_BOOKED: "Ce créneau n'est plus disponible.",
  SLOT_LOCKED: "Ce créneau est en cours de réservation par un autre utilisateur.",
  UNAUTHORIZED: "Votre session a expiré. Reconnectez-vous.",
  VALIDATION_ERROR: "Vérifiez les champs du formulaire.",
};

export function getApiErrorMessage(error: unknown, fallback = "Une erreur est survenue.") {
  if (!(error instanceof ApiError)) return fallback;

  const mapped = ERROR_MESSAGES[error.code];
  if (mapped) return mapped;

  return error.message || fallback;
}

export function getApiErrorHint(error: unknown) {
  if (!(error instanceof ApiError)) return null;

  if (error.details?.length) {
    return error.details
      .map((detail) => (detail.field ? `${detail.field}: ${detail.message}` : detail.message))
      .join("\n");
  }

  return `Code erreur: ${error.code}`;
}
