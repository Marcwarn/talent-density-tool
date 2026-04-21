export type Performance = 1 | 2 | 3 | 4 | 5;
export type Potential = 1 | 2 | 3 | 4 | 5;
export type Readiness =
  | "Redo nu"
  | "Redo inom 12 månader"
  | "Redo inom 24 månader"
  | "Ingen ersättare";
export type FlightRisk = "Låg" | "Medel" | "Hög";
export type CalibrationPriority = "Nu" | "Kvartal" | "Bevaka";
export type ActionStatus = "Ej startad" | "Pågår" | "Klar";
export type ConfidenceLevel = "Låg" | "Medel" | "Hög";
export type DecisionRecommendation =
  | "Behåll"
  | "Accelerera"
  | "De-riska"
  | "Ersätt"
  | "Fördjupa bedömning";
export type DecisionState = "Ej beslutad" | "För beslut" | "Beslutad" | "Eskalerad";
export type EvidenceState = "Otillräcklig" | "Rimlig" | "Stark";

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

export type LeaderRecord = Leader & {
  evidenceSummary: string;
  riskNarrative: string;
  dissentNote: string;
  decisionOwner: string;
  executiveRecommendation: DecisionRecommendation;
  decisionState: DecisionState;
  calibrationPriority: CalibrationPriority;
  actionStatus: ActionStatus;
  confidence: ConfidenceLevel;
  evidenceState: EvidenceState;
  nextReviewDate: string;
  lastReviewed: string;
};

export const baseLeaders: Leader[] = [
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

export const readinessOptions: Readiness[] = [
  "Redo nu",
  "Redo inom 12 månader",
  "Redo inom 24 månader",
  "Ingen ersättare"
];
export const flightRiskOptions: FlightRisk[] = ["Låg", "Medel", "Hög"];
export const priorityOptions: CalibrationPriority[] = ["Nu", "Kvartal", "Bevaka"];
export const actionStatusOptions: ActionStatus[] = ["Ej startad", "Pågår", "Klar"];
export const confidenceOptions: ConfidenceLevel[] = ["Låg", "Medel", "Hög"];
export const decisionRecommendationOptions: DecisionRecommendation[] = [
  "Behåll",
  "Accelerera",
  "De-riska",
  "Ersätt",
  "Fördjupa bedömning"
];
export const decisionStateOptions: DecisionState[] = [
  "Ej beslutad",
  "För beslut",
  "Beslutad",
  "Eskalerad"
];
export const evidenceStateOptions: EvidenceState[] = ["Otillräcklig", "Rimlig", "Stark"];

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

const confidenceScore: Record<ConfidenceLevel, number> = {
  Låg: -12,
  Medel: 0,
  Hög: 6
};

const evidenceScore: Record<EvidenceState, number> = {
  Otillräcklig: -14,
  Rimlig: 0,
  Stark: 8
};

function isoDateOffset(daysAhead: number) {
  const now = new Date();
  now.setDate(now.getDate() + daysAhead);
  return now.toISOString().slice(0, 10);
}

function defaultRecommendation(leader: Leader): DecisionRecommendation {
  if (leader.retentionRisk === "Hög" || leader.replacementReadiness === "Ingen ersättare") {
    return "De-riska";
  }
  if (leader.performance >= 4 && leader.potential >= 4) {
    return "Accelerera";
  }
  return "Behåll";
}

export function createInitialLeaders(): LeaderRecord[] {
  return baseLeaders.map((leader) => ({
    ...leader,
    evidenceSummary:
      leader.performance >= 4
        ? "Tre senaste kvartal visar stabil output, hög intern trovärdighet och tydlig affärseffekt."
        : "Bilden är blandad mellan operativ leverans, ledarbeteende och långsiktig skalbarhet.",
    riskNarrative:
      leader.retentionRisk === "Hög"
        ? "Kritisk kombination av rollberoende, marknadsexponering och låg bench coverage."
        : "Ingen akut risk, men beslutet påverkas av succession, kompensation och ledarskalning.",
    dissentNote:
      leader.replacementReadiness === "Ingen ersättare"
        ? "Risk för falsk trygghet om leverans väger tyngre än bench-risk i diskussionen."
        : "",
    decisionOwner: leader.area === "People" ? "VD" : "CHRO",
    executiveRecommendation: defaultRecommendation(leader),
    decisionState:
      leader.retentionRisk === "Hög" || leader.replacementReadiness === "Ingen ersättare"
        ? "För beslut"
        : "Ej beslutad",
    calibrationPriority:
      leader.retentionRisk === "Hög" || leader.replacementReadiness === "Ingen ersättare"
        ? "Nu"
        : "Kvartal",
    actionStatus: "Ej startad",
    confidence: leader.retentionRisk === "Hög" ? "Medel" : "Hög",
    evidenceState: leader.performance >= 4 ? "Stark" : "Rimlig",
    nextReviewDate:
      leader.retentionRisk === "Hög" || leader.replacementReadiness === "Ingen ersättare"
        ? isoDateOffset(30)
        : isoDateOffset(90),
    lastReviewed: new Date().toISOString().slice(0, 10)
  }));
}

export function calculateDensityScore(leader: LeaderRecord | Leader) {
  const weightedScore =
    leader.performance * 16 +
    leader.potential * 12 +
    leader.valuesFit * 0.16 +
    leader.leadershipImpact * 0.18 +
    leader.businessCriticality * 0.1 +
    readinessScore[leader.replacementReadiness] * 0.08 -
    retentionRiskScore[leader.retentionRisk] * 0.08 +
    ("confidence" in leader ? confidenceScore[leader.confidence] : 0) +
    ("evidenceState" in leader ? evidenceScore[leader.evidenceState] : 0);

  return Math.max(0, Math.min(100, Math.round(weightedScore)));
}

export function densityCategory(score: number) {
  if (score >= 85) return "Kärnstjärna";
  if (score >= 72) return "Stark";
  if (score >= 58) return "Behöver lyft";
  return "Riskzon";
}

export function portfolioMetrics(data: LeaderRecord[]) {
  const scored = data.map((leader) => ({
    ...leader,
    densityScore: calculateDensityScore(leader)
  }));

  const averageDensity =
    scored.reduce((sum, leader) => sum + leader.densityScore, 0) / scored.length;

  return {
    scored,
    averageDensity: Math.round(averageDensity),
    highRiskCount: scored.filter((leader) => leader.retentionRisk === "Hög").length,
    readyNowCount: scored.filter((leader) => leader.replacementReadiness === "Redo nu").length,
    noSuccessorCount: scored.filter(
      (leader) => leader.replacementReadiness === "Ingen ersättare"
    ).length,
    decisionsPending: scored.filter((leader) => leader.decisionState !== "Beslutad").length,
    lowConfidenceCount: scored.filter((leader) => leader.confidence === "Låg").length
  };
}

export function performanceLabel(value: Performance) {
  return ["Låg", "Under förväntan", "Solid", "Stark", "Exceptionell"][value - 1];
}

export function potentialLabel(value: Potential) {
  return ["Smal", "Växande", "Stabil", "Hög", "Transformativ"][value - 1];
}

export function decisionUrgency(leader: LeaderRecord) {
  if (
    leader.calibrationPriority === "Nu" ||
    leader.retentionRisk === "Hög" ||
    leader.replacementReadiness === "Ingen ersättare"
  ) {
    return "Akut";
  }
  if (leader.decisionState === "För beslut" || leader.confidence === "Låg") {
    return "Behöver forumtid";
  }
  return "Stabil";
}

export function exportSnapshot(data: LeaderRecord[], sessionNote: string) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      sessionNote,
      leaders: data.map((leader) => ({
        id: leader.id,
        name: leader.name,
        role: leader.role,
        area: leader.area,
        densityScore: calculateDensityScore(leader),
        densityCategory: densityCategory(calculateDensityScore(leader)),
        executiveRecommendation: leader.executiveRecommendation,
        decisionState: leader.decisionState,
        decisionOwner: leader.decisionOwner,
        confidence: leader.confidence,
        evidenceState: leader.evidenceState,
        retentionRisk: leader.retentionRisk,
        replacementReadiness: leader.replacementReadiness,
        calibrationPriority: leader.calibrationPriority,
        actionStatus: leader.actionStatus,
        evidenceSummary: leader.evidenceSummary,
        riskNarrative: leader.riskNarrative,
        dissentNote: leader.dissentNote,
        nextReviewDate: leader.nextReviewDate,
        lastReviewed: leader.lastReviewed
      }))
    },
    null,
    2
  );
}
