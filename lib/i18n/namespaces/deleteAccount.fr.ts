import type { deleteAccount as deleteAccountEn } from "./deleteAccount.en";

export const deleteAccount: typeof deleteAccountEn = {
  page: {
    title: "Supprimer votre compte",
    subtitle: "Comment demander la suppression de votre compte Riskyc Fashion et de vos données personnelles.",
  },
  sections: {
    howTitle: "Comment faire la demande",
    howBody:
      "Envoyez-nous une demande de suppression via la bulle de chat intégrée, ou par e-mail à support@riskycfashion.com, depuis l'adresse e-mail ou le numéro de téléphone associé à votre compte. Indiquez votre nom complet et, si vous le connaissez, l'e-mail de votre compte. Nous confirmerons votre identité puis traiterons la demande.",

    timelineTitle: "Délai de traitement",
    timelineBody:
      "Nous traitons les demandes de suppression de compte dans les 7 jours ouvrés suivant la confirmation de votre identité. Vous recevrez une confirmation une fois la suppression effectuée.",

    keptTitle: "Ce qui est supprimé, et ce que nous conservons",
    keptBody:
      "Nous supprimons le profil de votre compte (nom, e-mail, mot de passe), vos informations de livraison enregistrées, et vos jetons de notification push. Les enregistrements des commandes déjà passées — détails, montants et confirmation de paiement — sont conservés comme requis à des fins comptables et de résolution de litiges, mais ne sont plus rattachés à un compte actif une fois la suppression effectuée. Les commandes passées en tant qu'invité n'étaient jamais rattachées à un compte ; pour faire supprimer les détails d'une commande invitée spécifique, indiquez son numéro de commande dans votre demande.",

    contactTitle: "Nous contacter",
    contactBody:
      "Des questions sur cette démarche ? Contactez-nous via la bulle de chat sur n'importe quelle page, par e-mail à support@riskycfashion.com, ou par téléphone au +237 693 45 67 89.",
  },
  backToHome: "Retour à l'accueil",
};
