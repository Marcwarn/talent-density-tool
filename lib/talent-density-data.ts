export type Performance = 1 | 2 | 3 | 4 | 5;
export type Potential = 1 | 2 | 3 | 4 | 5;
export type Readiness = "Redo nu" | "Redo inom 12 månader" | "Redo inom 24 månader" | "Ingen ersättare";
export type FlightRisk = "Låg" | "Medel" | "Hög";

export type Leader = {
  id: string;
  name: string;
  role: string;
  area: string;
  tenureYears: number;
  performance: Performance;
  potential: Potential;
  valuesFit: number;
  leadershipImpact: number;
  businessCriticality: number;
  retentionRisk: FlightRisk;
  replacementReadiness: Readiness;
  salaryBandPosition: "Under marknad" | "I linje" | "Över marknad";
  successors: number;
  strengths: string[];
  gaps: string[];
  actions: string[];
};

export const leaders: Leader[] = [
  {
    id: "ceo",
    name: "Anna Berg",
    role: "VD",
    area: "Koncernledning",
    tenureYears: 4.2,
    performance: 5,
    potential: 5,
    valuesFit: 95,
    leadershipImpact: 94,
    businessCriticality: 100,
    retentionRisk: "Medel",
    replacementReadiness: "Redo inom 24 månader",
    salaryBandPosition: "I linje",
    successors: 1,
    strengths: ["Strategisk skärpa", "Kapitalmarknadsdialog", "Hög exekveringskraft"],
    gaps: ["Bredda intern succession", "Mindre operativ detaljstyrning"],
    actions: ["Utse två framtida ersättare", "Kvartalsvis coaching med styrelseordförande"]
  },
  {
    id: "cfo",
    name: "Johan Lind",
    role: "CFO",
    area: "Finans",
    tenureYears: 2.6,
    performance: 4,
    potential: 4,
    valuesFit: 87,
    leadershipImpact: 82,
    businessCriticality: 92,
    retentionRisk: "Låg",
    replacementReadiness: "Redo inom 12 månader",
    salaryBandPosition: "I linje",
    successors: 2,
    strengths: ["Finansiell kontroll", "Scenarioanalys", "Investerarkommunikation"],
    gaps: ["Bygga starkare ledarbänk", "Mindre beroende av extern rådgivning"],
    actions: ["Rotera controllerchef in i M&A-spår", "Skapa backup-plan för treasury"]
  },
  {
    id: "coo",
    name: "Sara Holm",
    role: "COO",
    area: "Operations",
    tenureYears: 1.8,
    performance: 3,
    potential: 4,
    valuesFit: 79,
    leadershipImpact: 74,
    businessCriticality: 88,
    retentionRisk: "Hög",
    replacementReadiness: "Ingen ersättare",
    salaryBandPosition: "Under marknad",
    successors: 0,
    strengths: ["Transformation", "Tempoväxling", "Kundnära förbättringsarbete"],
    gaps: ["Ledarstabilitet i fabriksnätet", "Konflikthantering i ledningsgrupp"],
    actions: ["Retention-paket inom 30 dagar", "Extern benchmark av operationsstruktur"]
  },
  {
    id: "cpo",
    name: "Mikael Sjö",
    role: "CPO",
    area: "Produkt",
    tenureYears: 3.1,
    performance: 5,
    potential: 4,
    valuesFit: 92,
    leadershipImpact: 89,
    businessCriticality: 85,
    retentionRisk: "Medel",
    replacementReadiness: "Redo inom 12 månader",
    salaryBandPosition: "Över marknad",
    successors: 1,
    strengths: ["Produktvision", "Tvärfunktionell alignment", "AI-roadmap"],
    gaps: ["Prioriteringsdisciplin", "Kommersiell koppling i roadmap"],
    actions: ["Koppla NRR till roadmap-governance", "Mentorskap för Director Product"]
  },
  {
    id: "cro",
    name: "Elin Wester",
    role: "CRO",
    area: "Commercial",
    tenureYears: 2.3,
    performance: 4,
    potential: 5,
    valuesFit: 84,
    leadershipImpact: 90,
    businessCriticality: 86,
    retentionRisk: "Medel",
    replacementReadiness: "Redo inom 24 månader",
    salaryBandPosition: "Under marknad",
    successors: 1,
    strengths: ["Intäktsmotor", "Ledning av säljorganisation", "Partnerskap"],
    gaps: ["Mer datadriven forecast hygiene", "Högre stabilitet bland frontline managers"],
    actions: ["Justera incitamentsmodell", "Bygg commercial academy för nästa chefsled"]
  },
  {
    id: "chro",
    name: "David Norén",
    role: "CHRO",
    area: "People",
    tenureYears: 5.4,
    performance: 4,
    potential: 3,
    valuesFit: 96,
    leadershipImpact: 78,
    businessCriticality: 70,
    retentionRisk: "Låg",
    replacementReadiness: "Redo nu",
    salaryBandPosition: "I linje",
    successors: 2,
    strengths: ["Kulturbyggande", "Förtroende i organisationen", "Ledarutveckling"],
    gaps: ["Tyngre people analytics", "Snabbare exekvering på svåra exit-beslut"],
    actions: ["Införa talent review-ritual per kvartal", "Sätta KPI för regretted attrition"]
  }
];

const retentionRiskScore: Record<FlightRisk, number> = {
  Låg: 15,
  Medel: 55,
  Hög: 90
};

const readinessScore: Record<Readiness, number> = {
  "Redo nu": 100,
  "Redo inom 12 månader": 70,
  "Redo inom 24 månader": 35,
  "Ingen ersättare": 0
};

export function calculateDensityScore(leader: Leader) {
  const weightedScore =
    leader.performance * 16 +
    leader.potential * 12 +
    leader.valuesFit * 0.16 +
    leader.leadershipImpact * 0.18 +
    leader.businessCriticality * 0.1 +
    readinessScore[leader.replacementReadiness] * 0.08 -
    retentionRiskScore[leader.retentionRisk] * 0.08;

  return Math.max(0, Math.min(100, Math.round(weightedScore)));
}

export function densityCategory(score: number) {
  if (score >= 85) return "Kärnstjärna";
  if (score >= 72) return "Stark";
  if (score >= 58) return "Behöver lyft";
  return "Riskzon";
}

export function portfolioMetrics(data: Leader[]) {
  const scored = data.map((leader) => ({
    ...leader,
    densityScore: calculateDensityScore(leader)
  }));

  const averageDensity =
    scored.reduce((sum, leader) => sum + leader.densityScore, 0) / scored.length;
  const highRiskCount = scored.filter((leader) => leader.retentionRisk === "Hög").length;
  const readyNowCount = scored.filter(
    (leader) => leader.replacementReadiness === "Redo nu"
  ).length;
  const noSuccessorCount = scored.filter(
    (leader) => leader.replacementReadiness === "Ingen ersättare"
  ).length;

  return {
    scored,
    averageDensity: Math.round(averageDensity),
    highRiskCount,
    readyNowCount,
    noSuccessorCount
  };
}
