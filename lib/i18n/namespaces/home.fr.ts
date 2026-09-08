import type { home as homeEn } from "./home.en";

export const home: typeof homeEn = {
  hero: {
    badge: "Nouvelle collection 2025",
    titleBefore: "Un style",
    titleHighlight: "qui vous ressemble",
    titleAfter: "",
    subtitle:
      "Découvrez des robes haut de gamme, des hauts tendance et des maillots à la mode. Exprimez votre style avec Riskyc Fashion — où chaque pièce raconte une histoire.",
    shopNow: "Acheter maintenant",
    viewDresses: "Voir les robes",
    stats: {
      products: "Produits",
      happyClients: "Clients satisfaits",
      rating: "Note",
    },
    images: {
      dresses: "Robes",
      jerseys: "Maillots",
      fashion: "Mode",
      newIn: "Nouveautés",
    },
    imageAlt: {
      dress: "Robe élégante",
      jersey: "Maillot du FC Barcelone",
      skirt: "Jupe tendance",
      maxiDress: "Robe longue",
    },
    newArrivals: {
      title: "Nouveautés",
      subtitle: "12 articles aujourd'hui",
    },
    sale: {
      title: "Articles en solde",
      subtitle: "Durée limitée",
    },
  },
  categories: {
    sectionTitle: "Acheter par catégorie",
    sectionSubtitle: "Trouvez exactement ce que vous cherchez",
    subcategoriesCount: "{{count}} sous-catégories",
    shopNow: "Acheter",
    badges: {
      new: "Nouveau",
      hot: "Tendance",
      sale: "Solde",
    },
  },
  featured: {
    sectionTitle: "Produits vedettes",
    sectionSubtitle: "Sélectionnés rien que pour vous",
    viewAll: "Tout voir",
    viewAllProducts: "Voir tous les produits",
    empty: "Aucun produit pour le moment — revenez bientôt.",
  },
  promo: {
    banner1: {
      badge: "Durée limitée",
      titleLine1: "Jusqu'à 30% de réduction",
      titleLine2: "sur les robes de soirée",
      subtitle: "Collection haut de gamme pour vos occasions spéciales",
      cta: "Voir les robes →",
    },
    banner2: {
      badge: "NOUVEAUTÉ",
      titleLine1: "Style urbain",
      titleLine2: "Maillots 2025",
      subtitle: "Des looks frais pour tous les styles",
      cta: "Voir les maillots →",
    },
    features: {
      fastDelivery: { title: "Livraison rapide", desc: "Livraison à domicile en 24 à 48h" },
      easyReturns: { title: "Retours faciles", desc: "Retours gratuits sous 7 jours" },
      bestPrices: { title: "Meilleurs prix", desc: "Qualité à prix abordable" },
      securePayment: { title: "Paiement sécurisé", desc: "Orange Money et MoMo" },
    },
  },
  testimonials: {
    sectionTitle: "Ce que disent nos clients",
    sectionSubtitle: "De vrais avis de vrais clients",
    boughtLabel: "Achat : {{product}}",
    reviews: {
      amina: {
        text: "J'adore ma robe de soirée de Riskyc Fashion ! La qualité est exceptionnelle et la livraison a été très rapide. Je commanderai à nouveau, c'est certain !",
        product: "Robe de soirée",
      },
      sophie: {
        text: "L'ensemble blazer est exactement comme sur l'image, voire encore plus beau en vrai. Le paiement par Orange Money s'est fait sans le moindre souci.",
        product: "Ensemble blazer",
      },
      marcus: {
        text: "Belle sélection de maillots. Le sweat à capuche tombe parfaitement et le tissu est de très bonne qualité. Le support par chat a aussi été très réactif !",
        product: "Sweat à capuche oversize",
      },
    },
  },
  downloadApp: {
    label: "Télécharger l'application",
    iosHint: {
      tap: "Appuyez sur",
      share: "Partager",
      then: "puis",
      addToHomeScreen: "Sur l'écran d'accueil",
      toInstall: "pour installer.",
    },
  },
};
