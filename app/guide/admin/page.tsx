"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { Shield } from "@/components/icons/fa";
import clsx from "clsx";

interface PlaybookSection {
  id: string;
  title: string;
  perms?: { key: string; kind: "view" | "manage" }[];
  body: string[];
  bullets?: string[];
  tip?: string;
}

const ORDER_STATUSES: { label: { en: string; fr: string }; meaning: { en: string; fr: string }; classes: string }[] = [
  {
    label: { en: "Pending", fr: "En attente" },
    meaning: { en: "Order just created — customer hasn't picked a payment method yet.", fr: "Commande tout juste créée — le client n'a pas encore choisi de moyen de paiement." },
    classes: "bg-gray-100 text-gray-600",
  },
  {
    label: { en: "Awaiting Payment", fr: "Paiement en attente" },
    meaning: { en: "Payment method chosen, dial code shown, no screenshot yet.", fr: "Moyen de paiement choisi, code affiché, pas encore de capture d'écran." },
    classes: "bg-orange-100 text-orange-600",
  },
  {
    label: { en: "Reviewing", fr: "En vérification" },
    meaning: { en: "Screenshot uploaded — this is the queue you act on.", fr: "Capture d'écran envoyée — c'est la file sur laquelle vous agissez." },
    classes: "bg-blue-100 text-blue-600",
  },
  {
    label: { en: "Validated", fr: "Validée" },
    meaning: { en: "Payment approved — now sitting in the Packing queue, waiting to be packed.", fr: "Paiement approuvé — en attente d'emballage dans la file Emballage." },
    classes: "bg-green-100 text-green-700",
  },
  {
    label: { en: "Packaging", fr: "Emballage" },
    meaning: { en: "A staff member has claimed it and is preparing the parcel.", fr: "Un membre de l'équipe s'en occupe et prépare le colis." },
    classes: "bg-purple-100 text-purple-700",
  },
  {
    label: { en: "Packaged", fr: "Emballée" },
    meaning: { en: "Sealed — ready for the packaging-confirmation message to go out.", fr: "Scellée — prête pour l'envoi du message de confirmation d'emballage." },
    classes: "bg-teal-100 text-teal-700",
  },
  {
    label: { en: "Cancelled", fr: "Annulée" },
    meaning: { en: "Rejected, always with a reason on file.", fr: "Rejetée, toujours avec un motif enregistré." },
    classes: "bg-red-100 text-red-600",
  },
];

const PRODUCT_FIELDS: { field: { en: string; fr: string }; required: boolean; note: { en: string; fr: string } }[] = [
  { field: { en: "Name", fr: "Nom" }, required: true, note: { en: "Shown everywhere — cards, detail page, receipts.", fr: "Affiché partout — fiches, page détail, reçus." } },
  { field: { en: "Description", fr: "Description" }, required: false, note: { en: "Long-form text on the product page.", fr: "Texte long sur la page produit." } },
  { field: { en: "Category / subcategory", fr: "Catégorie / sous-catégorie" }, required: false, note: { en: "Defaults to the first one — tap a subcategory pill to assign.", fr: "Première catégorie par défaut — appuyez sur une sous-catégorie pour l'assigner." } },
  { field: { en: "Price / original price", fr: "Prix / prix d'origine" }, required: false, note: { en: "Leave price at 0 for \"Price on request.\" A higher original price shows a strikethrough + discount badge.", fr: "Laissez le prix à 0 pour « Prix sur demande ». Un prix d'origine plus élevé affiche une remise barrée." } },
  { field: { en: "Bulk price tiers", fr: "Paliers de prix dégressifs" }, required: false, note: { en: "Rows like \"10 units = 50,000\" — pooled across every photo/size of that product at checkout.", fr: "Lignes du type « 10 unités = 50 000 » — regroupées sur toutes les photos/tailles du produit au paiement." } },
  { field: { en: "Images / video", fr: "Images / vidéo" }, required: true, note: { en: "Each photo can become its own orderable line for the customer.", fr: "Chaque photo peut devenir sa propre ligne commandable pour le client." } },
  { field: { en: "Colours & stock", fr: "Couleurs et stock" }, required: false, note: { en: "Name + swatch; stock is informational only, nothing blocks a sale at zero.", fr: "Nom + pastille ; le stock est informatif, rien ne bloque une vente à zéro." } },
  { field: { en: "Visible / Hidden", fr: "Visible / Masqué" }, required: false, note: { en: "Hidden products stay in the admin list but never appear on the storefront.", fr: "Les produits masqués restent dans la liste admin mais jamais sur la boutique." } },
  { field: { en: "Badge", fr: "Badge" }, required: false, note: { en: "None / New / Sale / Hot ribbon.", fr: "Aucun / Nouveau / Promo / Tendance." } },
  { field: { en: "Sizes", fr: "Tailles" }, required: false, note: { en: "Free text, normalised on blur, or a quick preset.", fr: "Texte libre, normalisé automatiquement, ou un préréglage rapide." } },
];

const SECTIONS: Record<"en" | "fr", PlaybookSection[]> = {
  en: [
    {
      id: "dashboard",
      title: "Dashboard",
      perms: [{ key: "VIEW_DASHBOARD", kind: "view" }],
      body: [
        "The landing screen after login — a snapshot, not a workspace. Four tiles (Total Revenue from validated orders, Total Orders with a pending count, Products across N categories, Chat with an unread count), an alert banner when something needs validating, and shortcuts into the busier pages.",
        "Below the tiles: a Recent Orders feed (newest six), Quick Actions (Review Orders, Add Product, Customer Chat — each badge-counted), an Order Status tally across every status, and a revenue banner once at least one order is validated.",
      ],
    },
    {
      id: "categories",
      title: "Categories & subcategories",
      perms: [
        { key: "VIEW_CATEGORIES", kind: "view" },
        { key: "MANAGE_CATEGORIES", kind: "manage" },
      ],
      body: [
        "This is the taxonomy customers filter by on the storefront — build it before adding products, since every product is assigned to exactly one category (and optionally one subcategory) at creation.",
        '"+ Add Category" opens an inline form: pick an icon, type a name — the URL-safe slug is generated automatically, with punctuation stripped so it can never split into two path segments.',
        "Hovering a category's cover image reveals an Upload button (a spinner shows while the file transfers); once set, a Trash button removes it again. This is the exact image customers see on the category tile when browsing the storefront — worth setting for anything customer-facing. Changing it is the same action: upload a new file and it replaces the old one.",
        'Click "Edit" on a category to turn its header into an inline form (icon + name); "+ Sub" adds a subcategory the same way, and clicking an existing subcategory\'s name makes it editable in place.',
      ],
      tip: 'Deletion is blocked while products remain assigned. Trying to delete a category or subcategory that still has products fails with "…still has products assigned to it. Delete those products first." Deleting a category with empty subcategories is allowed, but the confirmation tells you exactly how many will go with it.',
    },
    {
      id: "products",
      title: "Creating a product",
      perms: [
        { key: "VIEW_PRODUCTS", kind: "view" },
        { key: "MANAGE_PRODUCTS", kind: "manage" },
      ],
      body: [
        "One long form, six sections. Only a name and at least one photo are strictly required — everything else has a sensible default so a listing can go live fast and be enriched later.",
      ],
      tip: "Deleting a product has no blocking constraint — unlike categories, it can be removed even if past orders included it. Those orders keep the product's name and thumbnail exactly as they were (a snapshot taken at order time); only the live link to the catalogue entry is dropped.",
    },
    {
      id: "orders",
      title: "Managing orders",
      perms: [
        { key: "VIEW_ORDERS", kind: "view" },
        { key: "MANAGE_ORDERS", kind: "manage" },
      ],
      body: [
        "Every order moves through the same lifecycle. The Orders list is where most of it plays out; the detail page is where you'd go to actually look at something.",
        'The list has status-tab filters with live counts, a search box (matches the order ID), a table/grid toggle, and a "Scan" button that opens the camera to read the QR code on a customer\'s downloaded receipt — instant jump to that order, useful at a pickup counter.',
        "The order detail page has everything: the item list (photo, colour, size, which numbered image the customer picked, quantity, line price), payment info (method, USSD code used, account name, amount), the customer's shipping info, a timeline of who did what and when, and the messaging panel used for packaging confirmations.",
        'Click the payment screenshot to zoom it full-screen. From here — or from the "Reviewing" tab in the list — Validate moves the order forward, or Cancel/Reject opens a small form requiring a reason, which the customer then sees on their own tracking page.',
      ],
      tip: 'Once an order reaches Validated, its status can no longer be hand-picked from a dropdown — the "Change status" panel disappears. From here on, progress happens only through the Packing actions, so a stray click can\'t undo a validated or packaged order.',
    },
    {
      id: "treatment",
      title: "Packing",
      perms: [
        { key: "VIEW_TREATMENT", kind: "view" },
        { key: "MANAGE_TREATMENT", kind: "manage" },
        { key: "SEND_PACKAGING_MESSAGE", kind: "manage" },
      ],
      body: [
        "The physical fulfilment side — pulling a validated order off the shelf, boxing it, and telling the customer it's on its way. Organised as three personal queues: Waiting (every Validated order, for anyone with permission), In Progress (claimed by you via \"Start Packaging\"), and Done (marked complete by you).",
        "This split is for tidiness, not a security boundary — a super admin sees and can act on everyone's queue, and the same order is still visible via the Orders list to anyone with VIEW_ORDERS regardless. Every card also stamps who started and who finished it, visible here and on the order detail page's timeline.",
        'The "Delivery Team" button opens a roster of name + phone number, editable at any time — this list isn\'t tied to any one order.',
        'Once an order is Packaged, the message box on its detail page turns into the packaging-confirmation composer: attach a photo of the sealed parcel, write a short note, and send. The backend automatically appends a snapshot of the current delivery-team roster to that exact message, so even if the roster changes later, this order keeps the names and numbers that were current the moment it shipped. The customer sees this photo, note, and contact card on their tracking page and in the chat thread.',
      ],
      tip: "The Message Customer box only ever sends the packaging confirmation — it's locked until the order is marked Packaged (nothing to tell the customer yet), stays locked for anyone without SEND_PACKAGING_MESSAGE, and locks again once a confirmation has been sent, so a follow-up send can't silently replace the photo and delivery details already shown to the customer. Delete the sent confirmation first to send a replacement.",
    },
    {
      id: "chat",
      title: "Chat",
      perms: [
        { key: "VIEW_CHAT", kind: "view" },
        { key: "MANAGE_CHAT", kind: "manage" },
      ],
      body: [
        "One inbox for every customer conversation — general questions, order-specific threads opened from an order's own message box, and threads a customer starts themselves from the storefront's chat bubble.",
      ],
      bullets: [
        "Conversations update live and show single/double tick read receipts, same idea as WhatsApp.",
        "A quick-reply picker inserts common answers without retyping them.",
        "Voice notes are supported both ways — record one to send, and play back ones a customer sent, with a waveform scrubber.",
        "Search narrows the conversation list by customer name.",
      ],
    },
    {
      id: "customers",
      title: "Customers",
      perms: [
        { key: "VIEW_CUSTOMERS", kind: "view" },
        { key: "MANAGE_CUSTOMERS", kind: "manage" },
      ],
      body: [
        "Everyone who has created a storefront account — guests who check out without one don't appear here, only in Orders. Search by name, email, or phone.",
      ],
      bullets: [
        "Block — asks for confirmation, flips status to Blocked. A blocked customer can't sign in.",
        "Delete — removes the account outright.",
      ],
    },
    {
      id: "users",
      title: "Users & roles",
      perms: [
        { key: "VIEW_USERS", kind: "view" },
        { key: "MANAGE_USERS", kind: "manage" },
      ],
      body: [
        "This is what actually controls who can see and do everything above — every permission on this page traces back to a role assigned here.",
        'If the role doesn\'t exist yet, create it first: switch to the Roles tab → "+ New Role", give it a name and description, then tick permissions grouped by area. A group header shows All / Some / None as you tick, and clicking it toggles the whole group at once.',
        'On the Users tab, "+ New User" asks for first/last name, email, a password (minimum 6 characters), a Role dropdown, and Active/Inactive status. Save, and they can log in immediately with that role\'s permissions.',
        'Changing someone\'s role later: click "Edit" on their row — the same form reopens inline, pre-set to their current role. Pick a different one and save; leave the password blank to keep it unchanged.',
      ],
      tip: "You can't delete your own account — the delete button shows a locked padlock instead, so an admin can never accidentally lock themselves out. Deleting a role, on the other hand, is not blocked even if users are still assigned to it — reassign anyone on that role before removing it.",
    },
  ],
  fr: [
    {
      id: "dashboard",
      title: "Tableau de bord",
      perms: [{ key: "VIEW_DASHBOARD", kind: "view" }],
      body: [
        "L'écran d'accueil après connexion — un aperçu, pas un espace de travail. Quatre tuiles (chiffre d'affaires total des commandes validées, total des commandes avec un compteur en attente, produits répartis sur N catégories, chat avec un compteur de non-lus), une bannière d'alerte quand quelque chose doit être validé, et des raccourcis vers les pages les plus actives.",
        "Sous les tuiles : un flux des Commandes récentes (les six dernières), des Actions rapides (Vérifier les commandes, Ajouter un produit, Chat client — chacune avec son compteur), un décompte du Statut des commandes, et une bannière de revenu dès qu'au moins une commande est validée.",
      ],
    },
    {
      id: "categories",
      title: "Catégories et sous-catégories",
      perms: [
        { key: "VIEW_CATEGORIES", kind: "view" },
        { key: "MANAGE_CATEGORIES", kind: "manage" },
      ],
      body: [
        "C'est la taxonomie que les clients utilisent pour filtrer sur la boutique — à construire avant d'ajouter des produits, puisque chaque produit est assigné à exactement une catégorie (et éventuellement une sous-catégorie) à sa création.",
        "« + Ajouter une catégorie » ouvre un formulaire en ligne : choisissez une icône, saisissez un nom — le slug adapté aux URL est généré automatiquement, la ponctuation étant retirée pour qu'il ne puisse jamais se scinder en deux segments de chemin.",
        "Survoler l'image de couverture d'une catégorie révèle un bouton Téléverser (un indicateur de chargement s'affiche pendant le transfert) ; une fois définie, un bouton Corbeille permet de la retirer. C'est exactement l'image que les clients voient sur la vignette de catégorie en parcourant la boutique — à définir pour tout ce qui est visible côté client. La modifier revient au même geste : téléverser un nouveau fichier remplace l'ancien.",
        "Cliquer sur « Modifier » sur une catégorie transforme son en-tête en formulaire en ligne (icône + nom) ; « + Sous-cat. » ajoute une sous-catégorie de la même façon, et cliquer sur le nom d'une sous-catégorie existante le rend modifiable sur place.",
      ],
      tip: "La suppression est bloquée tant que des produits restent assignés. Essayer de supprimer une catégorie ou sous-catégorie qui a encore des produits échoue avec « …a encore des produits assignés. Supprimez-les d'abord. » Supprimer une catégorie avec des sous-catégories vides est autorisé, mais la confirmation indique précisément combien partiront avec elle.",
    },
    {
      id: "products",
      title: "Créer un produit",
      perms: [
        { key: "VIEW_PRODUCTS", kind: "view" },
        { key: "MANAGE_PRODUCTS", kind: "manage" },
      ],
      body: [
        "Un long formulaire en six sections. Seuls un nom et au moins une photo sont strictement requis — tout le reste a une valeur par défaut raisonnable, pour qu'une fiche puisse être publiée rapidement et enrichie ensuite.",
      ],
      tip: "Supprimer un produit n'a aucune contrainte bloquante — contrairement aux catégories, il peut être retiré même s'il a figuré dans des commandes passées. Ces commandes conservent le nom et la miniature du produit tels qu'ils étaient (un instantané pris au moment de la commande) ; seul le lien vivant vers la fiche catalogue disparaît.",
    },
    {
      id: "orders",
      title: "Gérer les commandes",
      perms: [
        { key: "VIEW_ORDERS", kind: "view" },
        { key: "MANAGE_ORDERS", kind: "manage" },
      ],
      body: [
        "Chaque commande traverse le même cycle de vie. La liste des commandes est là où l'essentiel se joue ; la page de détail sert à regarder une commande en particulier.",
        "La liste propose des onglets de filtre par statut avec compteurs en direct, une recherche (par numéro de commande), un basculement tableau/grille, et un bouton « Scanner » qui ouvre l'appareil photo pour lire le code QR imprimé sur le reçu téléchargé d'un client — accès instantané à cette commande, utile à un comptoir de retrait.",
        "La page de détail réunit tout : la liste des articles (photo, couleur, taille, numéro de l'image choisie par le client, quantité, prix de la ligne), les infos de paiement (méthode, code USSD utilisé, nom du compte, montant), les informations de livraison du client, une chronologie de qui a fait quoi et quand, et le panneau de messagerie utilisé pour les confirmations d'emballage.",
        "Cliquez sur la capture d'écran de paiement pour l'agrandir. Depuis cet endroit — ou depuis l'onglet « En vérification » de la liste — Valider fait avancer la commande, ou Annuler/Rejeter ouvre un petit formulaire demandant un motif, que le client voit ensuite sur sa propre page de suivi.",
      ],
      tip: "Une fois qu'une commande atteint le statut Validée, son statut ne peut plus être choisi manuellement dans un menu déroulant — le panneau « Changer le statut » disparaît. À partir de là, la progression ne se fait plus que via les actions d'Emballage, pour qu'un clic malencontreux ne puisse pas annuler une commande validée ou emballée.",
    },
    {
      id: "treatment",
      title: "Emballage",
      perms: [
        { key: "VIEW_TREATMENT", kind: "view" },
        { key: "MANAGE_TREATMENT", kind: "manage" },
        { key: "SEND_PACKAGING_MESSAGE", kind: "manage" },
      ],
      body: [
        "Le volet physique de l'exécution — sortir une commande validée, l'emballer, et prévenir le client qu'elle est en route. Organisé en trois files personnelles : En attente (toute commande Validée, pour quiconque a la permission), En cours (prise en charge par vous via « Démarrer l'emballage »), et Terminé (marquée comme complète par vous).",
        "Cette répartition sert la clarté, pas la sécurité — un super administrateur voit et peut agir sur les files de tout le monde, et la même commande reste visible depuis la liste des commandes pour quiconque a VIEW_ORDERS. Chaque carte indique aussi qui a démarré et qui a terminé, visible ici et dans la chronologie de la page de détail.",
        "Le bouton « Équipe de livraison » ouvre une liste de noms et numéros de téléphone, modifiable à tout moment — cette liste n'est liée à aucune commande en particulier.",
        "Une fois une commande Emballée, la zone de message de sa page de détail devient le compositeur de confirmation d'emballage : joignez une photo du colis scellé, rédigez une note courte, et envoyez. Le serveur ajoute automatiquement un instantané de l'équipe de livraison actuelle à ce message précis, afin que même si l'équipe change plus tard, cette commande garde les noms et numéros en vigueur au moment de l'envoi. Le client voit cette photo, cette note et cette carte de contact sur sa page de suivi et dans le fil de discussion.",
      ],
      tip: "La zone Message au client n'envoie que la confirmation d'emballage — elle est verrouillée jusqu'à ce que la commande soit marquée Emballée (rien à dire au client avant), reste verrouillée pour quiconque n'a pas SEND_PACKAGING_MESSAGE, et se reverrouille une fois une confirmation envoyée, afin qu'un envoi ultérieur ne puisse pas remplacer silencieusement la photo et les informations de livraison déjà montrées au client. Supprimez la confirmation envoyée pour en envoyer une nouvelle.",
    },
    {
      id: "chat",
      title: "Chat",
      perms: [
        { key: "VIEW_CHAT", kind: "view" },
        { key: "MANAGE_CHAT", kind: "manage" },
      ],
      body: [
        "Une seule boîte de réception pour toutes les conversations clients — questions générales, fils spécifiques à une commande ouverts depuis sa propre zone de message, et fils qu'un client démarre lui-même depuis la bulle de chat de la boutique.",
      ],
      bullets: [
        "Les conversations se mettent à jour en direct et affichent des accusés de lecture à coche simple/double, comme WhatsApp.",
        "Un sélecteur de réponses rapides insère des réponses courantes sans avoir à les retaper.",
        "Les messages vocaux fonctionnent dans les deux sens — en enregistrer un à envoyer, et écouter ceux envoyés par un client, avec un défilement en forme d'onde.",
        "La recherche filtre la liste des conversations par nom de client.",
      ],
    },
    {
      id: "customers",
      title: "Clients",
      perms: [
        { key: "VIEW_CUSTOMERS", kind: "view" },
        { key: "MANAGE_CUSTOMERS", kind: "manage" },
      ],
      body: [
        "Toute personne ayant créé un compte sur la boutique — les invités qui commandent sans compte n'apparaissent pas ici, seulement dans les Commandes. Recherche par nom, e-mail ou téléphone.",
      ],
      bullets: [
        "Bloquer — demande une confirmation, passe le statut à Bloqué. Un client bloqué ne peut plus se connecter.",
        "Supprimer — retire le compte définitivement.",
      ],
    },
    {
      id: "users",
      title: "Utilisateurs et rôles",
      perms: [
        { key: "VIEW_USERS", kind: "view" },
        { key: "MANAGE_USERS", kind: "manage" },
      ],
      body: [
        "C'est ce qui contrôle réellement qui peut voir et faire tout ce qui précède — chaque permission de cette page remonte à un rôle assigné ici.",
        "Si le rôle n'existe pas encore, créez-le d'abord : passez à l'onglet Rôles → « + Nouveau rôle », donnez-lui un nom et une description, puis cochez les permissions regroupées par domaine. Un en-tête de groupe affiche Tout / Certains / Aucun au fur et à mesure, et cliquer dessus bascule tout le groupe d'un coup.",
        "Dans l'onglet Utilisateurs, « + Nouvel utilisateur » demande prénom, nom, e-mail, un mot de passe (6 caractères minimum), un menu déroulant Rôle, et un statut Actif/Inactif. Enregistrez, et la personne peut se connecter immédiatement avec les permissions de ce rôle.",
        "Changer le rôle de quelqu'un plus tard : cliquez sur « Modifier » sur sa ligne — le même formulaire se rouvre en ligne, préréglé sur son rôle actuel. Choisissez-en un autre et enregistrez ; laissez le mot de passe vide pour le conserver inchangé.",
      ],
      tip: "Vous ne pouvez pas supprimer votre propre compte — le bouton de suppression affiche un cadenas verrouillé à la place, pour qu'un administrateur ne puisse jamais s'exclure par erreur. Supprimer un rôle, en revanche, n'est pas bloqué même si des utilisateurs y sont encore assignés — réassignez-les avant de le retirer.",
    },
  ],
};

function PermChip({ perm }: { perm: { key: string; kind: "view" | "manage" } }) {
  return (
    <span
      className={clsx(
        "font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border",
        perm.kind === "view" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-brand-50 text-brand-600 border-brand-200"
      )}
    >
      {perm.key}
    </span>
  );
}

export default function PlaybookPage() {
  const { language } = useTranslation();
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
          <Shield size={24} className="text-brand-500" />
        </div>
        <h1 className="font-display font-bold text-3xl text-gray-900">
          {language === "fr" ? "Guide de l'administration" : "Running the Riskyc admin"}
        </h1>
        <p className="text-gray-500 mt-2">
          {language === "fr"
            ? "Ce que fait chaque écran du back office, dans l'ordre où une nouvelle recrue les rencontre réellement."
            : "What each back-office screen does, in the order a new team member would actually meet them."}
        </p>
      </div>

      <div className="flex gap-10">
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
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <span className="font-mono text-xs font-semibold text-brand-500 bg-brand-50 border border-brand-100 rounded-md px-2 py-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="font-display font-bold text-xl text-gray-900">{s.title}</h2>
              </div>

              {s.perms && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {s.perms.map((p) => (
                    <PermChip key={p.key} perm={p} />
                  ))}
                </div>
              )}

              {s.body.map((p, pi) => (
                <p key={pi} className="text-sm text-gray-600 leading-relaxed mb-3">
                  {p}
                </p>
              ))}

              {s.id === "orders" && (
                <div className="rounded-2xl border border-gray-100 overflow-hidden mb-4">
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-gray-100">
                      {ORDER_STATUSES.map((row) => (
                        <tr key={row.label.en}>
                          <td className="px-3 py-2 whitespace-nowrap align-top">
                            <span className={clsx("font-semibold px-2 py-0.5 rounded-full", row.classes)}>{row.label[language]}</span>
                          </td>
                          <td className="px-3 py-2 text-gray-600 leading-relaxed">{row.meaning[language]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {s.id === "products" && (
                <div className="rounded-2xl border border-gray-100 overflow-x-auto mb-4">
                  <table className="w-full text-xs min-w-[480px]">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 uppercase text-[10px] tracking-wide">
                        <th className="text-left px-3 py-2 font-semibold">{language === "fr" ? "Champ" : "Field"}</th>
                        <th className="text-left px-3 py-2 font-semibold">{language === "fr" ? "Requis" : "Required"}</th>
                        <th className="text-left px-3 py-2 font-semibold">{language === "fr" ? "Utilité" : "What it's for"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {PRODUCT_FIELDS.map((row) => (
                        <tr key={row.field.en}>
                          <td className="px-3 py-2 font-semibold text-gray-800 whitespace-nowrap align-top">{row.field[language]}</td>
                          <td className="px-3 py-2 align-top whitespace-nowrap">
                            <span
                              className={clsx(
                                "font-mono text-[10px] font-semibold px-2 py-0.5 rounded",
                                row.required ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-400"
                              )}
                            >
                              {row.required ? (language === "fr" ? "requis" : "required") : (language === "fr" ? "optionnel" : "optional")}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-600 leading-relaxed">{row.note[language]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
              href="/admin"
              className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
            >
              {language === "fr" ? "Ouvrir l'administration" : "Open the admin"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
