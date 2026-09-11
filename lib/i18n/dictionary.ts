import type { Language } from "@/lib/types";

import { common as commonEn } from "./namespaces/common.en";
import { common as commonFr } from "./namespaces/common.fr";
import { nav as navEn } from "./namespaces/nav.en";
import { nav as navFr } from "./namespaces/nav.fr";
import { footer as footerEn } from "./namespaces/footer.en";
import { footer as footerFr } from "./namespaces/footer.fr";
import { home as homeEn } from "./namespaces/home.en";
import { home as homeFr } from "./namespaces/home.fr";
import { products as productsEn } from "./namespaces/products.en";
import { products as productsFr } from "./namespaces/products.fr";
import { cart as cartEn } from "./namespaces/cart.en";
import { cart as cartFr } from "./namespaces/cart.fr";
import { account as accountEn } from "./namespaces/account.en";
import { account as accountFr } from "./namespaces/account.fr";
import { help as helpEn } from "./namespaces/help.en";
import { help as helpFr } from "./namespaces/help.fr";
import { chat as chatEn } from "./namespaces/chat.en";
import { chat as chatFr } from "./namespaces/chat.fr";
import { adminCommon as adminCommonEn } from "./namespaces/adminCommon.en";
import { adminCommon as adminCommonFr } from "./namespaces/adminCommon.fr";
import { adminOrders as adminOrdersEn } from "./namespaces/adminOrders.en";
import { adminOrders as adminOrdersFr } from "./namespaces/adminOrders.fr";
import { adminProducts as adminProductsEn } from "./namespaces/adminProducts.en";
import { adminProducts as adminProductsFr } from "./namespaces/adminProducts.fr";
import { adminOps as adminOpsEn } from "./namespaces/adminOps.en";
import { adminOps as adminOpsFr } from "./namespaces/adminOps.fr";
import { terms as termsEn } from "./namespaces/terms.en";
import { terms as termsFr } from "./namespaces/terms.fr";
import { privacy as privacyEn } from "./namespaces/privacy.en";
import { privacy as privacyFr } from "./namespaces/privacy.fr";
import { deleteAccount as deleteAccountEn } from "./namespaces/deleteAccount.en";
import { deleteAccount as deleteAccountFr } from "./namespaces/deleteAccount.fr";

/**
 * One namespace per feature area (see lib/i18n/namespaces/) rather than two
 * giant en/fr files — this is what lets several people/agents fill in
 * translations for different parts of the app at the same time without
 * fighting over the same file. Each fr namespace types itself against its en
 * counterpart (`typeof xEn`), so a missing/mistyped key is a compile error,
 * not a silent blank string in production.
 */
export const dictionaries = {
  en: {
    common: commonEn,
    nav: navEn,
    footer: footerEn,
    home: homeEn,
    products: productsEn,
    cart: cartEn,
    account: accountEn,
    help: helpEn,
    chat: chatEn,
    adminCommon: adminCommonEn,
    adminOrders: adminOrdersEn,
    adminProducts: adminProductsEn,
    adminOps: adminOpsEn,
    terms: termsEn,
    privacy: privacyEn,
    deleteAccount: deleteAccountEn,
  },
  fr: {
    common: commonFr,
    nav: navFr,
    footer: footerFr,
    home: homeFr,
    products: productsFr,
    cart: cartFr,
    account: accountFr,
    help: helpFr,
    chat: chatFr,
    adminCommon: adminCommonFr,
    adminOrders: adminOrdersFr,
    adminProducts: adminProductsFr,
    adminOps: adminOpsFr,
    terms: termsFr,
    privacy: privacyFr,
    deleteAccount: deleteAccountFr,
  },
} satisfies Record<Language, Record<string, Record<string, unknown>>>;

export type Namespace = keyof typeof dictionaries.en;

function resolve(dict: Record<string, unknown>, path: string): unknown {
  let node: unknown = dict;
  for (const part of path.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

/**
 * Looks up "namespace.key" (or "namespace.nested.key") in the active
 * language, falling back to English if missing there too, and finally to
 * the raw key itself — so a translation gap shows up as an oddly literal
 * label in the UI instead of a crash.
 */
export function translate(lang: Language, path: string, vars?: Record<string, string | number>): string {
  const primary = resolve(dictionaries[lang], path);
  const value = typeof primary === "string" ? primary : (resolve(dictionaries.en, path) as string | undefined) ?? path;
  if (!vars) return value;
  return value.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}
