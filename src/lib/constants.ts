import { Motto } from "@/lib/types";

export const APP_NAME = "Fervet";

export const DEFAULT_MOTTOES: Array<Omit<Motto, "id">> = [
  { latin: "Acta non verba", english: "Deeds, not words" },
  {
    latin: "Age quod agis",
    english: "Whatever you do, do it to the best of your ability",
  },
  { latin: "Ora et labora", english: "Pray and work" },
  { latin: "Ad astra per aspera", english: "Through difficulty to the stars" },
  { latin: "Post proelium praemium", english: "After the battle, the reward" },
  {
    latin: "Fortis cadere potest, cedere non potest",
    english: "The brave may fall, but never yield",
  },
  {
    latin: "Fortis in fide et opere",
    english: "Steadfast in faith and work",
  },
  { latin: "Sic luceat lux", english: "Let your light so shine" },
  {
    latin: "In arce sitam quis occultabit",
    english: "A city on a hill cannot be hidden",
  },
  {
    latin: "Ad maiorem Dei gloriam",
    english: "For the greater glory of God",
  },
  {
    latin: "Floreat collegium, fervet opus in campis",
    english: "May the college flourish; work is burning in the fields",
  },
  { latin: "Transeamus in exemplum", english: "We shall be an example" },
];

export const DAILY_MINIMUMS = {
  languageMinutes: 20,
};

export const RUN_TYPES = [
  "easy",
  "long",
  "intervals",
  "tempo",
  "recovery",
  "sprint",
  "custom",
] as const;
