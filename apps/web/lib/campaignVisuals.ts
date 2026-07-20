import {
  Laptop,
  UtensilsCrossed,
  Shirt,
  Plane,
  Sparkles,
  Camera,
  Dumbbell,
  Home,
  Baby,
  Car,
  GraduationCap,
  HeartPulse,
  Palette,
} from "lucide-react";

/** Category-based fallback visual for campaign cards that have no cover image — matched by
 * keyword against the campaign's category name so it degrades gracefully for categories we
 * haven't explicitly mapped (falls back to the generic gradient + Sparkles icon). No external
 * image API involved, so there's no runtime cost, rate limit, or licensing question. */
const CATEGORY_VISUALS: { match: RegExp; gradient: string; icon: typeof Laptop }[] = [
  { match: /tech|gadget|electronic|app|software/i, gradient: "from-indigo-500 to-blue-600", icon: Laptop },
  { match: /food|beverage|f&b|culinary|cafe/i, gradient: "from-amber-500 to-orange-600", icon: UtensilsCrossed },
  { match: /fashion|apparel|style/i, gradient: "from-pink-500 to-rose-600", icon: Shirt },
  { match: /travel|tourism|hotel/i, gradient: "from-sky-500 to-cyan-600", icon: Plane },
  { match: /beauty|skincare|cosmetic/i, gradient: "from-fuchsia-500 to-pink-600", icon: Sparkles },
  { match: /photo|videograph|studio/i, gradient: "from-slate-600 to-slate-800", icon: Camera },
  { match: /fitness|sport|gym|health.?care|wellness/i, gradient: "from-emerald-500 to-teal-600", icon: Dumbbell },
  { match: /home|furniture|interior/i, gradient: "from-orange-400 to-amber-600", icon: Home },
  { match: /baby|parent|kids/i, gradient: "from-violet-400 to-purple-600", icon: Baby },
  { match: /auto|car|vehicle/i, gradient: "from-zinc-600 to-zinc-800", icon: Car },
  { match: /education|course|learning/i, gradient: "from-blue-500 to-indigo-700", icon: GraduationCap },
  { match: /medical|clinic|pharma/i, gradient: "from-red-400 to-rose-600", icon: HeartPulse },
  { match: /art|craft|design|lifestyle/i, gradient: "from-purple-500 to-violet-700", icon: Palette },
];

const DEFAULT_VISUAL = { gradient: "from-oc-500 to-oc-700", icon: Sparkles };

export function campaignVisualFor(categoryName: string | null) {
  if (!categoryName) return DEFAULT_VISUAL;
  const found = CATEGORY_VISUALS.find((v) => v.match.test(categoryName));
  return found ? { gradient: found.gradient, icon: found.icon } : DEFAULT_VISUAL;
}
