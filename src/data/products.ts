export type Product = {
  id: string;
  name: string;
  category: "Grains & Millets" | "Spices" | "Pulses & Dals" | "Oils & Ghee" | "Sweeteners & Tea";
  origin: string;
  unit: string;
  price: number;
  mrp: number;
  note: string;
};

export const categories = [
  "Grains & Millets",
  "Spices",
  "Pulses & Dals",
  "Oils & Ghee",
  "Sweeteners & Tea",
] as const;

export const products: Product[] = [
  {
    id: "sonamasuri",
    name: "Sona Masuri Rice",
    category: "Grains & Millets",
    origin: "Nalgonda, Telangana",
    unit: "5 kg",
    price: 549,
    mrp: 640,
    note: "Single-boiled, low glycemic, sun-dried on the threshing floor.",
  },
  {
    id: "bajra",
    name: "Pearl Millet (Bajra)",
    category: "Grains & Millets",
    origin: "Barmer, Rajasthan",
    unit: "1 kg",
    price: 96,
    mrp: 120,
    note: "Rain-fed desert crop, stone-ground fresh for rotis.",
  },
  {
    id: "ragi",
    name: "Finger Millet (Ragi)",
    category: "Grains & Millets",
    origin: "Tumkur, Karnataka",
    unit: "1 kg",
    price: 110,
    mrp: 135,
    note: "Calcium-rich, perfect for ragi porridge and flatbreads.",
  },
  {
    id: "turmeric",
    name: "Lakadong Turmeric",
    category: "Spices",
    origin: "Jaintia Hills, Meghalaya",
    unit: "250 g",
    price: 320,
    mrp: 399,
    note: "7%+ curcumin, hand-pounded by Khasi farming families.",
  },
  {
    id: "chilli",
    name: "Guntur Red Chilli",
    category: "Spices",
    origin: "Guntur, Andhra Pradesh",
    unit: "500 g",
    price: 245,
    mrp: 290,
    note: "Stemless whole chillies, fiery heat with deep colour.",
  },
  {
    id: "garam",
    name: "House Garam Masala",
    category: "Spices",
    origin: "Blended in Indore, MP",
    unit: "150 g",
    price: 189,
    mrp: 225,
    note: "Slow-roasted 14-spice blend, ground in small batches.",
  },
  {
    id: "toor",
    name: "Toor Dal (Arhar)",
    category: "Pulses & Dals",
    origin: "Latur, Maharashtra",
    unit: "2 kg",
    price: 358,
    mrp: 420,
    note: "Unpolished, no oil coating — cooks soft for sambar.",
  },
  {
    id: "moong",
    name: "Whole Green Moong",
    category: "Pulses & Dals",
    origin: "Jalore, Rajasthan",
    unit: "1 kg",
    price: 164,
    mrp: 195,
    note: "Sprouts in 12 hours, grown on kharif rotation land.",
  },
  {
    id: "kalachana",
    name: "Kala Chana",
    category: "Pulses & Dals",
    origin: "Bundelkhand, UP",
    unit: "1 kg",
    price: 142,
    mrp: 170,
    note: "Desi black chickpea, high fibre, nutty and firm.",
  },
  {
    id: "ghee",
    name: "Bilona Gir Cow Ghee",
    category: "Oils & Ghee",
    origin: "Junagadh, Gujarat",
    unit: "500 ml",
    price: 1240,
    mrp: 1450,
    note: "Hand-churned from curd, grass-fed Gir cows.",
  },
  {
    id: "mustardoil",
    name: "Kachi Ghani Mustard Oil",
    category: "Oils & Ghee",
    origin: "Bharatpur, Rajasthan",
    unit: "1 L",
    price: 385,
    mrp: 440,
    note: "Wood-pressed at low heat, sharp and pungent.",
  },
  {
    id: "coconutoil",
    name: "Virgin Coconut Oil",
    category: "Oils & Ghee",
    origin: "Palakkad, Kerala",
    unit: "500 ml",
    price: 470,
    mrp: 550,
    note: "Cold-pressed from copra dried in the Malabar sun.",
  },
  {
    id: "jaggery",
    name: "Organic Jaggery Blocks",
    category: "Sweeteners & Tea",
    origin: "Kolhapur, Maharashtra",
    unit: "1 kg",
    price: 128,
    mrp: 160,
    note: "Chemical-free, boiled in iron pans at the village mill.",
  },
  {
    id: "honey",
    name: "Wild Forest Honey",
    category: "Sweeteners & Tea",
    origin: "Sundarbans, West Bengal",
    unit: "500 g",
    price: 640,
    mrp: 750,
    note: "Raw, unheated, gathered by Mouli honey collectors.",
  },
  {
    id: "assamtea",
    name: "Assam Orthodox Tea",
    category: "Sweeteners & Tea",
    origin: "Jorhat, Assam",
    unit: "250 g",
    price: 299,
    mrp: 360,
    note: "Second-flush leaves, malty and strong enough for spiced milk tea.",
  },
];

export const inr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
