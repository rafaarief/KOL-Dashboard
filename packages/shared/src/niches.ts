export const NICHE_TAXONOMY = [
  "Food and Beverage",
  "Cafe and Restaurant Review",
  "Beauty",
  "Fashion",
  "Lifestyle",
  "Travel",
  "Local Places",
  "Events",
  "Entertainment",
  "Photography",
  "Photobooth",
  "Campus and Student",
  "Parenting",
  "Fitness and Sports",
  "Automotive",
  "Technology",
  "Gaming",
  "Education",
  "Finance",
  "Business and Career",
  "Home and Interior",
  "Wedding",
  "Music",
  "Comedy",
  "General Creator",
  "Other",
] as const;

export type Niche = (typeof NICHE_TAXONOMY)[number];

export function isValidNiche(value: string): value is Niche {
  return (NICHE_TAXONOMY as readonly string[]).includes(value);
}

/** Lightweight keyword → niche map used as the deterministic fallback when AI classification is unavailable or fails. */
export const NICHE_KEYWORD_HINTS: Record<Niche, string[]> = {
  "Food and Beverage": ["makan", "kuliner", "makanan", "minuman", "food", "drink", "resto"],
  "Cafe and Restaurant Review": ["cafe", "kafe", "review tempat makan", "restaurant", "kopi", "coffee"],
  Beauty: ["makeup", "skincare", "beauty", "kecantikan", "rias"],
  Fashion: ["fashion", "ootd", "outfit", "style"],
  Lifestyle: ["lifestyle", "sehari-hari", "vlog"],
  Travel: ["travel", "wisata", "trip", "liburan", "jalan-jalan"],
  "Local Places": ["tempat", "spot", "hidden gem", "blok m", "jakarta selatan"],
  Events: ["event", "acara", "festival", "launching"],
  Entertainment: ["hiburan", "entertainment"],
  Photography: ["foto", "photo", "photography", "kamera"],
  Photobooth: ["photobooth", "photo booth", "photobox", "foto box", "self photo"],
  "Campus and Student": ["kampus", "mahasiswa", "kuliah", "campus", "student"],
  Parenting: ["parenting", "anak", "ibu", "keluarga"],
  "Fitness and Sports": ["gym", "olahraga", "fitness", "workout", "sport"],
  Automotive: ["mobil", "motor", "otomotif", "automotive"],
  Technology: ["teknologi", "gadget", "tech", "aplikasi"],
  Gaming: ["game", "gaming", "esport"],
  Education: ["edukasi", "belajar", "education", "tutorial"],
  Finance: ["keuangan", "investasi", "finance", "saham"],
  "Business and Career": ["bisnis", "karier", "business", "career", "usaha"],
  "Home and Interior": ["rumah", "interior", "dekorasi", "home"],
  Wedding: ["wedding", "pernikahan", "nikah"],
  Music: ["musik", "music", "lagu", "cover"],
  Comedy: ["komedi", "comedy", "lucu", "prank"],
  "General Creator": [],
  Other: [],
};
