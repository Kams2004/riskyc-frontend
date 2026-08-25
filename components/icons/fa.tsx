"use client";

/**
 * FontAwesome equivalents of the lucide-react icons the storefront used to
 * import, each wrapped to accept the same `size`/`className` props as the
 * lucide originals — so every call site (`<ShoppingCart size={16} .../>`)
 * keeps working unchanged; only the import source moved.
 */

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCircleExclamation,
  faArrowLeft,
  faArrowRight,
  faCheck,
  faCircleCheck,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faClock,
  faCopy,
  faCreditCard,
  faEye,
  faEyeSlash,
  faGlobe,
  faHeart,
  faCircleQuestion,
  faLock,
  faRightToBracket,
  faRightFromBracket,
  faEnvelope,
  faBars,
  faCompress,
  faMinus,
  faLocationDot,
  faCommentDots,
  faBox,
  faPaperclip,
  faPhone,
  faPlus,
  faRotateLeft,
  faMagnifyingGlass,
  faPaperPlane,
  faShareNodes,
  faShield,
  faShieldHalved,
  faBagShopping,
  faCartShopping,
  faSliders,
  faStar,
  faStore,
  faTag,
  faTrash,
  faUpload,
  faUser,
  faUserPlus,
  faXmark,
  faCircleXmark,
  faBolt,
  faImage,
  faDownload,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebookF,
  faInstagram,
  faXTwitter,
  faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";

interface IconProps {
  size?: number;
  className?: string;
}

function makeIcon(def: IconDefinition) {
  const Icon = ({ size = 16, className }: IconProps) => (
    <FontAwesomeIcon icon={def} className={className} style={{ width: size, height: size }} />
  );
  return Icon;
}

export const AlertCircle = makeIcon(faCircleExclamation);
export const ArrowLeft = makeIcon(faArrowLeft);
export const ArrowRight = makeIcon(faArrowRight);
export const Check = makeIcon(faCheck);
export const CheckCircle2 = makeIcon(faCircleCheck);
export const ChevronDown = makeIcon(faChevronDown);
export const ChevronLeft = makeIcon(faChevronLeft);
export const ChevronRight = makeIcon(faChevronRight);
export const Clock = makeIcon(faClock);
export const Copy = makeIcon(faCopy);
export const CreditCard = makeIcon(faCreditCard);
export const Eye = makeIcon(faEye);
export const EyeOff = makeIcon(faEyeSlash);
export const Facebook = makeIcon(faFacebookF);
export const Globe = makeIcon(faGlobe);
export const Heart = makeIcon(faHeart);
export const HelpCircle = makeIcon(faCircleQuestion);
export const Instagram = makeIcon(faInstagram);
export const Lock = makeIcon(faLock);
export const LogIn = makeIcon(faRightToBracket);
export const LogOut = makeIcon(faRightFromBracket);
export const Mail = makeIcon(faEnvelope);
export const Menu = makeIcon(faBars);
export const Minimize2 = makeIcon(faCompress);
export const Minus = makeIcon(faMinus);
export const MapPin = makeIcon(faLocationDot);
export const MessageCircle = makeIcon(faCommentDots);
export const Package = makeIcon(faBox);
export const Paperclip = makeIcon(faPaperclip);
export const Phone = makeIcon(faPhone);
export const Plus = makeIcon(faPlus);
export const RotateCcw = makeIcon(faRotateLeft);
export const Search = makeIcon(faMagnifyingGlass);
export const Send = makeIcon(faPaperPlane);
export const Share2 = makeIcon(faShareNodes);
export const Shield = makeIcon(faShield);
export const ShieldCheck = makeIcon(faShieldHalved);
export const ShoppingBag = makeIcon(faBagShopping);
export const ShoppingCart = makeIcon(faCartShopping);
export const SlidersHorizontal = makeIcon(faSliders);
export const Star = makeIcon(faStar);
export const Store = makeIcon(faStore);
export const Tag = makeIcon(faTag);
export const Trash2 = makeIcon(faTrash);
export const Truck = makeIcon(faTruck);
export const Twitter = makeIcon(faXTwitter);
export const Whatsapp = makeIcon(faWhatsapp);
export const Upload = makeIcon(faUpload);
export const User = makeIcon(faUser);
export const UserPlus = makeIcon(faUserPlus);
export const X = makeIcon(faXmark);
export const XCircle = makeIcon(faCircleXmark);
export const Zap = makeIcon(faBolt);
export const ImageIcon = makeIcon(faImage);
export const Download = makeIcon(faDownload);
