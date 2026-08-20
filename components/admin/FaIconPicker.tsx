"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faShirt, faVest, faHatCowboy, faHatWizard, faGlasses, faGem, faRing,
  faSocks, faMitten, faUmbrella, faPersonDress, faPerson,
  faBagShopping, faCartShopping, faStore, faTags, faTag,
  faBarcode, faReceipt, faBox, faBoxesStacked, faGift,
  faPercent, faMoneyBill, faMoneyBills, faCreditCard, faWallet,
  faFutbol, faBasketball, faFootball, faBaseball, faVolleyball, faTrophy,
  faMedal, faDumbbell, faPersonRunning, faPersonBiking, faPersonSwimming,
  faBowlingBall,
  faLeaf, faSeedling, faTree, faSun, faMoon, faStar, faFire, faSnowflake,
  faCloud, faRainbow, faWind, faDroplet, faFeather, faDove,
  faMobileScreen, faLaptop, faDesktop, faCamera, faImage, faImages, faVideo,
  faMagnifyingGlass, faBell, faHeart, faBookmark, faFlag, faLock, faShield,
  faMugHot, faWineGlass, faChampagneGlasses, faCakeCandles, faUtensils,
  faMusic, faHeadphones, faMicrophone, faPalette, faPaintbrush, faScissors,
  faCompass,
} from "@fortawesome/free-solid-svg-icons";
import { Search, X } from "lucide-react";
import clsx from "clsx";

// ── Icon registry: name → IconDefinition ──────────────────────────────────────
const ICON_MAP: Record<string, IconDefinition> = {
  "shirt": faShirt,
  "vest": faVest,
  "hat-cowboy": faHatCowboy,
  "hat-wizard": faHatWizard,
  "glasses": faGlasses,
  "gem": faGem,
  "ring": faRing,
  "socks": faSocks,
  "mitten": faMitten,
  "umbrella": faUmbrella,
  "person-dress": faPersonDress,
  "person": faPerson,
  "bag-shopping": faBagShopping,
  "cart-shopping": faCartShopping,
  "store": faStore,
  "tags": faTags,
  "tag": faTag,
  "barcode": faBarcode,
  "receipt": faReceipt,
  "box": faBox,
  "boxes-stacked": faBoxesStacked,
  "gift": faGift,
  "percent": faPercent,
  "money-bill": faMoneyBill,
  "money-bills": faMoneyBills,
  "credit-card": faCreditCard,
  "wallet": faWallet,
  "futbol": faFutbol,
  "basketball": faBasketball,
  "football": faFootball,
  "baseball": faBaseball,
  "volleyball": faVolleyball,
  "trophy": faTrophy,
  "medal": faMedal,
  "dumbbell": faDumbbell,
  "person-running": faPersonRunning,
  "person-biking": faPersonBiking,
  "person-swimming": faPersonSwimming,
  "bowling-ball": faBowlingBall,
  "leaf": faLeaf,
  "seedling": faSeedling,
  "tree": faTree,
  "sun": faSun,
  "moon": faMoon,
  "star": faStar,
  "fire": faFire,
  "snowflake": faSnowflake,
  "cloud": faCloud,
  "rainbow": faRainbow,
  "wind": faWind,
  "droplet": faDroplet,
  "feather": faFeather,
  "dove": faDove,
  "mobile-screen": faMobileScreen,
  "laptop": faLaptop,
  "desktop": faDesktop,
  "camera": faCamera,
  "image": faImage,
  "images": faImages,
  "video": faVideo,
  "magnifying-glass": faMagnifyingGlass,
  "bell": faBell,
  "heart": faHeart,
  "bookmark": faBookmark,
  "flag": faFlag,
  "lock": faLock,
  "shield": faShield,
  "mug-hot": faMugHot,
  "wine-glass": faWineGlass,
  "champagne-glasses": faChampagneGlasses,
  "cake-candles": faCakeCandles,
  "utensils": faUtensils,
  "music": faMusic,
  "headphones": faHeadphones,
  "microphone": faMicrophone,
  "palette": faPalette,
  "paintbrush": faPaintbrush,
  "scissors": faScissors,
  "compass": faCompass,
};

// ── Curated groups ────────────────────────────────────────────────────────────
const ICON_GROUPS: { label: string; icons: string[] }[] = [
  {
    label: "Fashion & Clothing",
    icons: ["shirt","vest","hat-cowboy","hat-wizard","glasses","gem","ring","socks","mitten","umbrella","person-dress","person"],
  },
  {
    label: "Shopping",
    icons: ["bag-shopping","cart-shopping","store","tags","tag","barcode","receipt","box","boxes-stacked","gift","percent","money-bill","money-bills","credit-card","wallet"],
  },
  {
    label: "Sports & Activities",
    icons: ["futbol","basketball","football","baseball","volleyball","trophy","medal","dumbbell","person-running","person-biking","person-swimming","bowling-ball"],
  },
  {
    label: "Nature & Elements",
    icons: ["leaf","seedling","tree","sun","moon","star","fire","snowflake","cloud","rainbow","wind","droplet","feather","dove"],
  },
  {
    label: "Tech & Interface",
    icons: ["mobile-screen","laptop","desktop","camera","image","images","video","magnifying-glass","bell","heart","bookmark","flag","lock","shield"],
  },
  {
    label: "Food & Lifestyle",
    icons: ["mug-hot","wine-glass","champagne-glasses","cake-candles","utensils","music","headphones","microphone","palette","paintbrush","scissors","compass"],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Stored format: "fa:solid:<name>" */
function toStored(name: string) {
  return `fa:solid:${name}`;
}

function fromStored(val: string): string | null {
  if (val.startsWith("fa:solid:")) return val.slice("fa:solid:".length);
  if (val.startsWith("fa:")) return val.split(":")[2] ?? null;
  return null;
}

function getIconDef(name: string): IconDefinition | null {
  return ICON_MAP[name] ?? null;
}

// ── FaIconPreview — use anywhere to render a stored value ─────────────────────
export function FaIconPreview({ value, size = 20 }: { value: string; size?: number }) {
  const name = fromStored(value);
  if (name) {
    const def = getIconDef(name);
    if (def) return <SafeFA def={def} style={{ width: size, height: size }} />;
  }
  return <span style={{ fontSize: size }}>{value}</span>;
}

// ── FaIconPicker ──────────────────────────────────────────────────────────────
interface Props {
  value: string;
  onChange: (val: string) => void;
  isDark?: boolean;
}

export default function FaIconPicker({ value, onChange, isDark = false }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return ICON_GROUPS;
    const q = search.toLowerCase();
    return ICON_GROUPS
      .map((g) => ({ ...g, icons: g.icons.filter((ic) => ic.includes(q)) }))
      .filter((g) => g.icons.length > 0);
  }, [search]);

  const selectedName = fromStored(value);
  const selectedDef = selectedName ? getIconDef(selectedName) : null;

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={clsx(
          "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors min-w-[100px]",
          isDark
            ? "bg-gray-800 border-gray-600 text-white hover:border-brand-500"
            : "bg-white border-gray-300 text-gray-700 hover:border-brand-400"
        )}
        title="Pick icon"
      >
        <span className="flex items-center justify-center w-5 h-5 flex-shrink-0">
          {selectedDef
            ? <SafeFA def={selectedDef} />
            : <span>{value || "?"}</span>
          }
        </span>
        <span className={clsx("text-xs truncate", isDark ? "text-gray-400" : "text-gray-500")}>
          {selectedName ?? "pick icon"}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className={clsx(
          "absolute left-0 top-full mt-2 z-50 rounded-2xl border shadow-2xl w-[340px] max-h-[420px] flex flex-col overflow-hidden",
          isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        )}>
          {/* Search bar */}
          <div className={clsx("flex items-center gap-2 px-3 py-2.5 border-b flex-shrink-0", isDark ? "border-gray-700" : "border-gray-200")}>
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search icons…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={clsx("flex-1 bg-transparent text-sm outline-none", isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400")}
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Grid */}
          <div className="overflow-y-auto flex-1 p-3 space-y-4">
            {filteredGroups.length === 0 && (
              <p className={clsx("text-xs text-center py-6", isDark ? "text-gray-500" : "text-gray-400")}>
                No icons found
              </p>
            )}
            {filteredGroups.map((group) => (
              <div key={group.label}>
                <p className={clsx("text-[10px] font-semibold uppercase tracking-wider mb-2", isDark ? "text-gray-500" : "text-gray-400")}>
                  {group.label}
                </p>
                <div className="grid grid-cols-8 gap-1">
                  {group.icons.map((name) => {
                    const def = getIconDef(name);
                    if (!def) return null;
                    const stored = toStored(name);
                    const isSelected = value === stored;
                    return (
                      <IconButton
                        key={name}
                        def={def}
                        name={name}
                        isSelected={isSelected}
                        isDark={isDark}
                        onSelect={() => { onChange(stored); setOpen(false); }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components that guarantee FontAwesomeIcon only receives a valid def ──

function SafeFA({ def, style }: { def: IconDefinition; style?: React.CSSProperties }) {
  return <FontAwesomeIcon icon={def} style={style as React.CSSProperties & Record<string, string>} />;
}

function IconButton({
  def, name, isSelected, isDark, onSelect,
}: {
  def: IconDefinition;
  name: string;
  isSelected: boolean;
  isDark: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      title={name}
      onClick={onSelect}
      className={clsx(
        "flex items-center justify-center w-8 h-8 rounded-lg transition-all text-sm",
        isSelected
          ? "bg-brand-500 text-white shadow"
          : isDark
          ? "text-gray-400 hover:bg-gray-700 hover:text-white"
          : "text-gray-500 hover:bg-brand-50 hover:text-brand-600"
      )}
    >
      <FontAwesomeIcon icon={def} />
    </button>
  );
}
