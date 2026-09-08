"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/data";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { HelpCircle } from "@/components/icons/fa";
import clsx from "clsx";

interface GuideSection {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
  tip?: string;
}

const STATUS_STEPS: { label: { en: string; fr: string }; classes: string }[] = [
  { label: { en: "Placed", fr: "Passée" }, classes: "bg-gray-100 text-gray-600" },
  { label: { en: "Awaiting Payment", fr: "Paiement en attente" }, classes: "bg-orange-100 text-orange-600" },
  { label: { en: "Reviewing", fr: "En vérification" }, classes: "bg-blue-100 text-blue-600" },
  { label: { en: "Validated", fr: "Validée" }, classes: "bg-green-100 text-green-700" },
  { label: { en: "Packaging", fr: "Emballage" }, classes: "bg-purple-100 text-purple-700" },
  { label: { en: "Packaged", fr: "Emballée" }, classes: "bg-teal-100 text-teal-700" },
];

const SECTIONS: Record<"en" | "fr", GuideSection[]> = {
  en: [
    {
      id: "browse",
      title: "Browse the catalogue",
      body: [
        'The homepage is the catalogue itself — there\'s no separate landing page to click through first. It opens straight onto every visible product, with a sort dropdown (Featured, Price ascending/descending, Top Rated, Newest) and a running count of how many products match your current filters.',
      ],
    },
    {
      id: "filter",
      title: "Filter by category, and by price",
      body: [
        'A row of category pills sits above the product grid — tap one to narrow the list instantly, no page reload. Selecting a category reveals its subcategories as a second row underneath, and tapping "All" clears the filter. On larger screens the same filters live in a sidebar next to the grid instead of pills.',
        'Opening "Filters" also reveals a price range: two fields, Min and Max, defaulting to ' +
          formatPrice(0) +
          "–" +
          formatPrice(200000) +
          '. Type any range and the grid updates immediately, with the chosen amounts shown underneath. Category, subcategory, search, and price all combine at once — a single "Clear all" link resets every one of them.',
      ],
      tip: "Only categories that currently hold visible products show up as filters — picking one never leads to an empty page.",
    },
    {
      id: "open",
      title: "Open a product",
      body: [
        "Tapping any card opens its detail page: a full photo gallery, name, description, price, available colours and sizes, delivery/warranty notes, and the ordering controls covered next.",
      ],
    },
    {
      id: "configure",
      title: "Configure the order using the photos",
      body: [
        "Every photo in the gallery can become its own line of the order. Pick a colour once at the top — it applies no matter which photo is active — then work through the photos one at a time: tap a photo to make it active, choose a size for it if the product has sizes, and use the − / + buttons to set how many of that exact photo to order.",
        'As soon as one photo has a quantity, a "Your selection" list appears below, recapping every configured photo — its thumbnail, size, quantity, and running price — each with its own −/+/remove controls, so nothing needs a trip to the cart to fix.',
      ],
    },
    {
      id: "bulk",
      title: "Bulk pricing",
      body: [
        'Products that qualify for a volume discount show it right under the price, as plain "quantity = total" tags — for example "10 = ' +
          formatPrice(50000) +
          '". These tiers count the whole product, not one photo: split 10 units across three different photos (say 2, 3, and 5) and it still qualifies for the 10-unit tier, because the pricing engine adds up every line of that same product first, then spreads the tier price back across your lines.',
        "Add an 11th unit as a fourth line, and ten of them stay at the bulk rate while only the new one is priced on its own — the order never falls back to charging everyone the single-unit price.",
      ],
      tip:
        "Example: 2 + 3 + 5 = 10 units hits the \"10 = " +
        formatPrice(50000) +
        '" tier, so the order totals ' +
        formatPrice(50000) +
        ". Add one more unit and the total becomes " +
        formatPrice(57000) +
        " — the ten stay at the bulk rate, plus one unit at its normal price. You never need to do this math yourself; the total shown is always already worked out this way.",
    },
    {
      id: "ask",
      title: "Ask a question about the product",
      body: [
        'A dashed "Ask about this product" button sits near the bottom of every product page, below the delivery and returns icons. Tapping it opens the chat bubble with a message already drafted — the product\'s name, price, and photo attached — so asking about stock, sizing, or anything else takes one tap, not a fresh explanation.',
      ],
    },
    {
      id: "add-or-order",
      title: "Add to Cart, or Order Now",
      body: ["Two buttons sit at the bottom of every configured product page, and they lead to two different rhythms:"],
      bullets: [
        "Add to Cart — saves the configured lines to your cart and keeps you on the page, for when you still want to browse other products before paying.",
        "Order Now — skips the cart and jumps straight into a checkout for just what's configured, for when this is the only thing you're buying right now.",
      ],
    },
    {
      id: "help-modal",
      title: 'The "How to Order" help button',
      body: [
        "A help icon near the top of the product page opens a plain-language walk-through of the whole process, for anyone ordering for the first time: choose your product, click Order Now, fill in your information, choose a payment method, upload your payment screenshot, wait for validation, and receive your order. It's a quick refresher of everything on this page, without leaving the product.",
      ],
    },
    {
      id: "cart-page",
      title: "Managing your cart",
      body: [
        "The cart page has two tabs: Cart, for what you're about to buy, and My Orders, listing everything you've already placed. Each cart line shows its photo, colour, size, and photo number, with its own quantity stepper.",
        'Tap + to add one more of that line, or − to remove one — taking it down to zero removes the line entirely, the same as tapping its trash icon. "Add more articles" at the bottom of the list goes back to the catalogue to add another product, and "Clear all" empties the whole cart in one action. The order summary alongside shows the subtotal, any bulk savings highlighted in green, and the final total, with a Pay Now button that starts checkout.',
      ],
    },
    {
      id: "checkout",
      title: "Checkout, step by step",
      body: [
        "Checkout is four short screens, tracked by a progress bar at the top:",
      ],
      bullets: [
        "Choose payment — pick Orange Money or MTN Mobile Money; the total to pay is shown, fees included.",
        "Complete payment — dial the USSD code shown (or open the app), transfer the exact amount to the account name displayed, then screenshot that confirmation.",
        "Upload proof — tap the upload area and choose the screenshot; this is what the team checks before validating the order.",
        'Your information — name, phone, and either a delivery address (town + street) or "Shop pick-up".',
      ],
      tip: "Guests can check out without creating an account — a phone number and delivery details are enough. Signing in first just means the order also shows up under My Orders automatically, and your name and phone are pre-filled.",
    },
    {
      id: "receipt",
      title: "Receipt & confirmation",
      body: ["The confirmation screen is the receipt for this moment, before the shop has even looked at the payment:"],
      bullets: [
        "Download Receipt — a PDF with the order details and a scannable QR code, which the shop uses to pull the order up instantly at pickup or delivery.",
        "An order summary card — order ID, name, phone, delivery method, amount, and a live status badge.",
        "Track My Order — a direct link to the tracking page.",
        'A "what happens next" note, and a Chat about this order button pre-linked to the order.',
      ],
    },
    {
      id: "tracking",
      title: "Tracking your order",
      body: [
        "The tracking link works for guests and account holders alike — no login needed, just the link — and a refresh button pulls the latest status on demand.",
      ],
      tip: undefined,
    },
    {
      id: "account",
      title: "Creating an account, and signing in with Google",
      body: [
        "An account is never required to order — a phone number and delivery details are enough as a guest. Creating one adds three things: every order shows up automatically under My Orders, checkout pre-fills your name and phone, and you get a personal referral link and code from your Account page.",
        'Signing up asks for a first and last name, email, an optional phone number, a password, and an optional referral code from whoever invited you. "Continue with Google" does the same thing in one tap — it only ever shares your name, email, and profile photo, and creates the account automatically the first time you use it.',
      ],
    },
    {
      id: "referrals",
      title: "Referrals",
      body: [
        "Every account has its own referral link and code, both on the Account page — share either one, and anyone who signs up through it is linked to you. Your Account page shows both your direct referrals and the people referred by your referrals, one level down.",
      ],
      tip: "There's no separate discount or promo-code system today — the referral code is Riskyc's version of one. It's a way to track your network within Riskyc Fashion, not a guaranteed cash reward, and the program can change over time.",
    },
    {
      id: "help-center",
      title: "Help Center & the chat bubble",
      body: [
        "The Help Center (linked from the footer) answers the most common questions about ordering, payment, delivery, and returns, alongside three quick perks — fast delivery, secure pay, easy returns — and two ways to reach the team directly: chat, or email.",
        'The chat bubble itself is present on every page, with or without an account. It\'s the same conversation whether it was started from the bubble, from "Ask about this product", or from an order\'s confirmation screen — one thread per customer, so there\'s no need to repeat context.',
      ],
    },
    {
      id: "more",
      title: "Good to know",
      body: [],
      bullets: [
        "Language — a toggle switches the whole storefront between English and French at any time.",
        "Re-downloading a receipt — available again from My Orders whenever it's needed, not only right after ordering.",
        "Terms & Conditions — the rules behind all of this are on their own page, linked from the footer and the sign-up form.",
      ],
    },
  ],
  fr: [
    {
      id: "browse",
      title: "Parcourir le catalogue",
      body: [
        "La page d'accueil est le catalogue lui-même — il n'y a pas de page de destination séparée à traverser d'abord. Elle s'ouvre directement sur tous les produits visibles, avec un menu de tri (En vedette, Prix croissant/décroissant, Les mieux notés, Nouveautés) et un compteur du nombre de produits correspondant aux filtres en cours.",
      ],
    },
    {
      id: "filter",
      title: "Filtrer par catégorie, et par prix",
      body: [
        'Une rangée de catégories sous forme de pastilles se trouve au-dessus de la grille de produits — appuyez sur l\'une d\'elles pour affiner la liste instantanément, sans rechargement de page. Sélectionner une catégorie révèle ses sous-catégories sur une deuxième rangée en dessous, et appuyer sur « Tout » réinitialise le filtre. Sur les écrans plus grands, les mêmes filtres se trouvent dans une barre latérale à côté de la grille plutôt qu\'en pastilles.',
        "Ouvrir « Filtres » révèle aussi une fourchette de prix : deux champs, Min et Max, avec par défaut " +
          formatPrice(0) +
          "–" +
          formatPrice(200000) +
          " . Saisissez n'importe quelle fourchette et la grille se met à jour immédiatement, avec les montants choisis affichés en dessous. Catégorie, sous-catégorie, recherche et prix se combinent tous en même temps — un seul lien « Tout effacer » réinitialise l'ensemble.",
      ],
      tip: "Seules les catégories contenant actuellement des produits visibles apparaissent comme filtres — en choisir une ne mène jamais à une page vide.",
    },
    {
      id: "open",
      title: "Ouvrir un produit",
      body: [
        "Appuyer sur une fiche ouvre sa page détaillée : une galerie de photos complète, le nom, la description, le prix, les couleurs et tailles disponibles, les informations de livraison/garantie, et les contrôles de commande décrits ensuite.",
      ],
    },
    {
      id: "configure",
      title: "Configurer la commande à l'aide des photos",
      body: [
        "Chaque photo de la galerie peut devenir sa propre ligne de commande. Choisissez une couleur une fois en haut — elle s'applique quelle que soit la photo active — puis parcourez les photos une par une : appuyez sur une photo pour la rendre active, choisissez une taille pour elle si le produit en propose, et utilisez les boutons − / + pour définir la quantité souhaitée pour cette photo précise.",
        "Dès qu'une photo a une quantité définie, une liste « Votre sélection » apparaît en dessous, récapitulant chaque photo configurée — sa miniature, sa taille, sa quantité et son prix cumulé — chacune avec ses propres contrôles −/+/suppression, pour ne jamais avoir besoin d'un détour par le panier.",
      ],
    },
    {
      id: "bulk",
      title: "Tarifs dégressifs",
      body: [
        'Les produits éligibles à une remise sur volume l\'affichent juste sous le prix, sous forme d\'étiquettes simples « quantité = total » — par exemple « 10 = ' +
          formatPrice(50000) +
          ' ». Ces paliers comptent l\'ensemble du produit, pas une seule photo : répartissez 10 unités sur trois photos différentes (par exemple 2, 3 et 5) et cela reste éligible au palier de 10 unités, car le moteur de tarification additionne d\'abord toutes les lignes de ce même produit, puis répartit le prix du palier entre vos lignes.',
        "Ajoutez une 11ᵉ unité en quatrième ligne, et dix d'entre elles restent au tarif dégressif tandis que seule la nouvelle est facturée à son propre tarif — la commande ne revient jamais à facturer tout le monde au tarif unitaire simple.",
      ],
      tip:
        "Exemple : 2 + 3 + 5 = 10 unités atteint le palier « 10 = " +
        formatPrice(50000) +
        " », donc la commande totalise " +
        formatPrice(50000) +
        ". Ajoutez une unité de plus et le total devient " +
        formatPrice(57000) +
        " — les dix restent au tarif dégressif, plus une unité à son prix normal. Vous n'avez jamais besoin de faire ce calcul vous-même ; le total affiché est toujours déjà calculé ainsi.",
    },
    {
      id: "ask",
      title: "Poser une question sur le produit",
      body: [
        'Un bouton en pointillés « Poser une question sur ce produit » se trouve vers le bas de chaque page produit, sous les icônes de livraison et de retours. Il ouvre la bulle de chat avec un message déjà rédigé — le nom du produit, son prix et sa photo joints — pour que poser une question sur le stock, la taille ou autre chose ne prenne qu\'un geste, sans avoir à tout réexpliquer.',
      ],
    },
    {
      id: "add-or-order",
      title: "Ajouter au panier, ou Commander maintenant",
      body: ["Deux boutons se trouvent en bas de chaque page produit configurée, et mènent à deux rythmes différents :"],
      bullets: [
        "Ajouter au panier — enregistre les lignes configurées dans le panier et vous laisse sur la page, pour quand vous souhaitez encore parcourir d'autres produits avant de payer.",
        "Commander maintenant — saute le panier et ouvre directement un paiement pour ce qui vient d'être configuré, pour quand c'est la seule chose que vous achetez maintenant.",
      ],
    },
    {
      id: "help-modal",
      title: "Le bouton d'aide « Comment commander »",
      body: [
        "Une icône d'aide en haut de la page produit ouvre un guide en langage simple de tout le processus, pour quiconque commande pour la première fois : choisissez votre produit, cliquez sur Commander maintenant, renseignez vos informations, choisissez un moyen de paiement, téléversez votre capture d'écran de paiement, attendez la validation, et recevez votre commande. C'est un rappel rapide de tout ce qui figure sur cette page, sans quitter le produit.",
      ],
    },
    {
      id: "cart-page",
      title: "Gérer son panier",
      body: [
        "La page panier comporte deux onglets : Panier, pour ce que vous êtes sur le point d'acheter, et Mes commandes, listant tout ce que vous avez déjà commandé. Chaque ligne du panier affiche sa photo, sa couleur, sa taille et son numéro de photo, avec son propre sélecteur de quantité.",
        "Appuyez sur + pour ajouter une unité à cette ligne, ou sur − pour en retirer une — la ramener à zéro supprime entièrement la ligne, comme appuyer sur son icône de corbeille. « Ajouter d'autres articles » en bas de la liste retourne au catalogue pour ajouter un autre produit, et « Tout effacer » vide le panier en une seule action. Le résumé de commande à côté affiche le sous-total, les éventuelles économies sur les tarifs dégressifs mises en évidence en vert, et le total final, avec un bouton Payer maintenant qui lance le paiement.",
      ],
    },
    {
      id: "checkout",
      title: "Le paiement, étape par étape",
      body: ["Le paiement se déroule en quatre écrans courts, suivis par une barre de progression en haut :"],
      bullets: [
        "Choisir le paiement — sélectionnez Orange Money ou MTN Mobile Money ; le montant total à payer est affiché, frais inclus.",
        "Finaliser le paiement — composez le code USSD affiché (ou ouvrez l'application), transférez le montant exact au nom de compte indiqué, puis capturez cette confirmation.",
        "Téléverser la preuve — appuyez sur la zone de téléversement et choisissez la capture d'écran ; c'est ce que l'équipe vérifie avant de valider la commande.",
        "Vos informations — nom, téléphone, et soit une adresse de livraison (ville + rue), soit « Retrait en boutique ».",
      ],
      tip: "Les invités peuvent finaliser leur commande sans créer de compte — un numéro de téléphone et une adresse de livraison suffisent. Se connecter au préalable signifie simplement que la commande apparaît aussi automatiquement dans Mes commandes, et que votre nom et téléphone sont pré-remplis.",
    },
    {
      id: "receipt",
      title: "Reçu et confirmation",
      body: ["L'écran de confirmation est le reçu de ce moment, avant même que la boutique n'ait examiné le paiement :"],
      bullets: [
        "Télécharger le reçu — un PDF avec les détails de la commande et un code QR scannable, que la boutique utilise pour retrouver instantanément la commande lors du retrait ou de la livraison.",
        "Une carte récapitulative — numéro de commande, nom, téléphone, mode de livraison, montant, et un badge de statut en direct.",
        "Suivre ma commande — un lien direct vers la page de suivi.",
        "Une note « et ensuite ? », et un bouton Discuter de cette commande pré-lié à la commande.",
      ],
    },
    {
      id: "tracking",
      title: "Suivre sa commande",
      body: [
        "Le lien de suivi fonctionne aussi bien pour les invités que pour les titulaires de compte — aucune connexion nécessaire, juste le lien — et un bouton d'actualisation récupère le dernier statut à la demande.",
      ],
    },
    {
      id: "account",
      title: "Créer un compte, et se connecter avec Google",
      body: [
        "Un compte n'est jamais requis pour commander — un numéro de téléphone et une adresse de livraison suffisent en tant qu'invité. En créer un ajoute trois choses : chaque commande apparaît automatiquement dans Mes commandes, le paiement pré-remplit votre nom et téléphone, et vous obtenez un lien et un code de parrainage personnels depuis votre page Compte.",
        "L'inscription demande un prénom, un nom, un e-mail, un numéro de téléphone facultatif, un mot de passe, et un code de parrainage facultatif de la personne qui vous a invité. « Continuer avec Google » fait la même chose en un geste — cela ne partage jamais que votre nom, votre e-mail et votre photo de profil, et crée le compte automatiquement dès la première utilisation.",
      ],
    },
    {
      id: "referrals",
      title: "Parrainage",
      body: [
        "Chaque compte dispose de son propre lien et code de parrainage, tous deux sur la page Compte — partagez l'un ou l'autre, et quiconque s'inscrit ainsi est lié à vous. Votre page Compte affiche à la fois vos parrainages directs et les personnes parrainées par vos propres filleuls, un niveau plus loin.",
      ],
      tip: "Il n'existe pas aujourd'hui de système de code promo ou de remise séparé — le code de parrainage en tient lieu chez Riskyc. C'est un moyen de suivre votre réseau au sein de Riskyc Fashion, pas une récompense en argent garantie, et le programme peut évoluer dans le temps.",
    },
    {
      id: "help-center",
      title: "Centre d'aide et bulle de chat",
      body: [
        "Le Centre d'aide (accessible depuis le pied de page) répond aux questions les plus fréquentes sur la commande, le paiement, la livraison et les retours, avec trois avantages en un coup d'œil — livraison rapide, paiement sécurisé, retours faciles — et deux façons de joindre directement l'équipe : le chat, ou l'e-mail.",
        "La bulle de chat elle-même est présente sur chaque page, avec ou sans compte. C'est la même conversation qu'elle ait été lancée depuis la bulle, depuis « Poser une question sur ce produit », ou depuis l'écran de confirmation d'une commande — un seul fil par client, pour ne jamais avoir à réexpliquer le contexte.",
      ],
    },
    {
      id: "more",
      title: "Bon à savoir",
      body: [],
      bullets: [
        "Langue — un bouton permet de basculer toute la boutique entre l'anglais et le français à tout moment.",
        "Retélécharger un reçu — de nouveau disponible depuis Mes commandes chaque fois que nécessaire, pas seulement juste après la commande.",
        "Conditions générales — les règles derrière tout cela figurent sur leur propre page, accessible depuis le pied de page et le formulaire d'inscription.",
      ],
    },
  ],
};

export default function GuidePage() {
  const { t, language } = useTranslation();
  const sections = SECTIONS[language];
  const [activeId, setActiveId] = useState(sections[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-15% 0px -70% 0px" }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [language]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-12 max-w-2xl mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <HelpCircle size={24} className="text-brand-500" />
        </div>
        <h1 className="font-display font-bold text-3xl text-gray-900">
          {language === "fr" ? "Comment fonctionne la commande" : "How ordering works"}
        </h1>
        <p className="text-gray-500 mt-2">
          {language === "fr"
            ? "Un guide complet, écran par écran — de la navigation dans le catalogue au suivi de votre livraison."
            : "A complete walk-through, screen by screen — from browsing the catalogue to tracking your delivery."}
        </p>
      </div>

      <div className="flex gap-10">
        {/* Sticky section nav — desktop only */}
        <aside className="w-64 flex-shrink-0 hidden lg:block">
          <nav className="sticky top-24 space-y-0.5">
            {sections.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={clsx(
                  "flex items-baseline gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                  activeId === s.id ? "bg-brand-50 text-brand-600" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                )}
              >
                <span className="font-mono text-[10px] text-gray-300">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1 max-w-2xl space-y-10">
          {sections.map((s, i) => (
            <section
              key={s.id}
              id={s.id}
              ref={(el) => {
                sectionRefs.current[s.id] = el;
              }}
              className="scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-xs font-semibold text-brand-500 bg-brand-50 border border-brand-100 rounded-md px-2 py-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="font-display font-bold text-xl text-gray-900">{s.title}</h2>
              </div>

              {s.body.map((p, pi) => (
                <p key={pi} className="text-sm text-gray-600 leading-relaxed mb-3">
                  {p}
                </p>
              ))}

              {s.id === "tracking" && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {STATUS_STEPS.map((step) => (
                    <span
                      key={step.label.en}
                      className={clsx("text-xs font-semibold px-2.5 py-1 rounded-full", step.classes)}
                    >
                      {step.label[language]}
                    </span>
                  ))}
                </div>
              )}

              {s.bullets && (
                <ul className="space-y-2 mb-3">
                  {s.bullets.map((b, bi) => (
                    <li key={bi} className="flex gap-2.5 text-sm text-gray-600 leading-relaxed">
                      <span className="text-brand-400 flex-shrink-0">—</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              {s.tip && (
                <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 mt-2">
                  <p className="text-xs text-brand-700 leading-relaxed">{s.tip}</p>
                </div>
              )}
            </section>
          ))}

          <div className="pt-6 border-t border-gray-100 flex flex-wrap gap-3">
            <Link
              href="/help"
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              {language === "fr" ? "Centre d'aide" : "Help Center"}
            </Link>
            <Link
              href="/terms"
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              {t("terms.page.title")}
            </Link>
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
            >
              {language === "fr" ? "Découvrir le catalogue" : "Browse the catalogue"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
