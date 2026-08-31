import type { chat as chatEn } from "./chat.en";

export const chat: typeof chatEn = {
  widget: {
    title: "Support Riskyc Fashion",
    subtitle: "Répond généralement en quelques minutes",
    emptyState: "Envoyez-nous un message et notre équipe vous répondra sous peu.",
    placeholder: "Écrivez un message...",
    attachPhoto: "Joindre une photo",
    removePhoto: "Retirer la photo",
    recordVoice: "Enregistrer un message vocal",
    sendError: "Échec de l'envoi — vérifiez votre connexion et réessayez.",
    footerTag: "Riskyc Fashion · Douala, Cameroun",
    sharedPhotoAlt: "Photo partagée",
    attachedPhotoAlt: "Pièce jointe",
  },
  voice: {
    sending: "Envoi du message vocal…",
    deleteRecording: "Supprimer l'enregistrement",
    listening: "Écoute en cours…",
    pause: "Pause",
    resume: "Reprendre",
    send: "Envoyer le message vocal",
  },
};
