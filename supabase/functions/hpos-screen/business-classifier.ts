export type BusinessAssessment = {
  state: "PASS" | "FAIL" | "OPEN";
  description: string;
  sic: string;
  category: string;
  method: string;
  reason: string;
  sourceUrl?: string;
  filingUrl?: string;
};

const PERMITTED_CATEGORIES: Array<[string, RegExp]> = [
  ["HEALTHCARE_AND_LIFE_SCIENCES", /\b(HEALTH ?CARE|PHARMACEUTICAL|MEDICINES?|MEDICAL (?:DEVICE|TECHNOLOGY|PRODUCT)|BIOTECH(?:NOLOGY)?|DIAGNOSTIC|THERAPEUTIC)\b/i],
  ["TECHNOLOGY", /\b(SOFTWARE|SEMICONDUCTOR|INFORMATION TECHNOLOGY|CYBER ?SECURITY|CLOUD (?:PLATFORM|COMPUTING)|ELECTRONIC (?:COMPONENT|EQUIPMENT))\b/i],
  ["INDUSTRIALS", /\b(MANUFACTUR(?:E|ER|ING)|INDUSTRIAL (?:EQUIPMENT|MACHINERY|TECHNOLOGY)|ENGINEERING|AUTOMATION|CONSTRUCTION MATERIALS?)\b/i],
  ["ENERGY_AND_UTILITIES", /\b(OIL AND GAS (?:EXPLORATION|PRODUCTION)|RENEWABLE ENERGY|SOLAR ENERGY|WIND ENERGY|POWER GENERATION|ELECTRICITY DISTRIBUTION)\b/i],
  ["TRANSPORT_AND_LOGISTICS", /\b(TRANSPORTATION|LOGISTICS|FREIGHT|SHIPPING SERVICES?)\b/i],
  ["TELECOMMUNICATIONS", /\b(TELECOMMUNICATIONS?|WIRELESS COMMUNICATIONS?|BROADBAND SERVICES?)\b/i],
  ["ENVIRONMENTAL_SERVICES", /\b(WASTE MANAGEMENT|RECYCLING|ENVIRONMENTAL SERVICES?)\b/i],
  ["MATERIALS_AND_MINING", /\b(MINING|METALS?|CHEMICAL PRODUCTS?|BUILDING MATERIALS?)\b/i],
  ["CONSUMER_AND_RETAIL", /\b(RETAIL(?:ER|ING)?|APPAREL|HOUSEHOLD PRODUCTS?|CONSUMER PRODUCTS?|FOOD PRODUCTS?)\b/i]
];

function cleanText(value: unknown, max = 3000) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function prohibitedSic(sicRaw: string, description: string) {
  const sic = Number(sicRaw), d = description.toUpperCase();
  if ((sic >= 2082 && sic <= 2085) || (sic >= 2100 && sic <= 2199) || (sic >= 3480 && sic <= 3489) || (sic >= 3760 && sic <= 3769) || (sic >= 6020 && sic <= 6799) || sic === 7993) return true;
  return /(CASINO|GAMBLING|BREWER|DISTILL|TOBACCO|FIREARMS|AMMUNITION|DEFENSE CONTRACTOR|MORTGAGE BANK|COMMERCIAL BANK)/.test(d);
}

function prohibitedBusinessText(description: string) {
  return /\b(CASINO|GAMBLING|BETTING|BREWER(?:Y|IES)?|DISTILL(?:ERY|ER|ING)?|TOBACCO|FIREARMS?|AMMUNITION|DEFEN[CS]E CONTRACTOR|COMMERCIAL BANK|CONVENTIONAL BANKING|CONVENTIONAL INSURANCE|MORTGAGE LENDING|CONSUMER CREDIT|INTEREST[- ]BASED FINANC(?:E|ING)|PORK PROCESSING|ADULT ENTERTAINMENT|PORNOGRAPH(?:Y|IC))\b/i.test(description);
}

function permittedBusinessCategory(description: string) {
  return PERMITTED_CATEGORIES.find(([, pattern]) => pattern.test(description))?.[0] || "";
}

export function classifyBusiness(descriptionRaw: string, sicRaw: string, official: boolean, sourceUrl = "", filingUrl = ""): BusinessAssessment {
  const description = cleanText(descriptionRaw), sic = String(sicRaw || "").trim();
  if (prohibitedSic(sic, description) || prohibitedBusinessText(description)) return { state: "FAIL", description, sic, category: "PROHIBITED_CORE_BUSINESS", method: "OFFICIAL_BUSINESS_EXCLUSION_V1", reason: "Die offizielle Branchenangabe oder Tätigkeitsbeschreibung enthält ein ausgeschlossenes Kerngeschäft.", sourceUrl, filingUrl };
  if (!official) return { state: "OPEN", description, sic, category: "", method: "UNVERIFIED_DISCOVERY", reason: "Eine Discovery-Quelle reicht für die Geschäftsmodellfreigabe nicht aus.", sourceUrl, filingUrl };
  if (/^\d{4}$/.test(sic)) return { state: "PASS", description, sic, category: "SIC_NON_PROHIBITED", method: "OFFICIAL_SIC_NEGATIVE_SCREEN_V1", reason: "Der offizielle SIC-Code fällt nicht in die versionierte Ausschlusstaxonomie.", sourceUrl, filingUrl };
  const category = permittedBusinessCategory(description);
  if (category) return { state: "PASS", description, sic, category, method: "OFFICIAL_DESCRIPTION_POSITIVE_SCREEN_V1", reason: "Die offizielle Tätigkeitsbeschreibung ist einer zulässigen Geschäftskategorie eindeutig zuordenbar.", sourceUrl, filingUrl };
  return { state: "OPEN", description, sic, category: "", method: "OFFICIAL_BUSINESS_DESCRIPTION_UNCLASSIFIED", reason: "Die offizielle Tätigkeitsbeschreibung ist noch keiner eindeutigen Regelkategorie zuordenbar.", sourceUrl, filingUrl };
}
