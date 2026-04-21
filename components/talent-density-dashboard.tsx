"use client";

import { useEffect, useMemo, useState } from "react";
import {
  actionStatusOptions,
  calculateDensityScore,
  confidenceOptions,
  createInitialLeaders,
  decisionRecommendationOptions,
  decisionStateOptions,
  decisionUrgency,
  densityCategory,
  evidenceStateOptions,
  exportSnapshot,
  flightRiskOptions,
  performanceLabel,
  portfolioMetrics,
  potentialLabel,
  priorityOptions,
  readinessOptions,
  type ActionStatus,
  type CalibrationPriority,
  type ConfidenceLevel,
  type DecisionRecommendation,
  type DecisionState,
  type EvidenceState,
  type FlightRisk,
  type LeaderRecord,
  type Performance,
  type Potential,
  type Readiness
} from "@/lib/talent-density-data";

const STORAGE_KEY = "talent-density-tool.v3";
const tabs = ["Beslutsrum", "Portföljkarta", "Bench risk", "Åtaganden"] as const;

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function getTone(score: number) {
  if (score >= 85) return "excellent";
  if (score >= 72) return "strong";
  if (score >= 58) return "watch";
  return "risk";
}

function sortLeaders(data: LeaderRecord[], sortBy: string) {
  const sorted = [...data];
  sorted.sort((a, b) => {
    if (sortBy === "decision") {
      const rank = { Akut: 3, "Behöver forumtid": 2, Stabil: 1 };
      return rank[decisionUrgency(b)] - rank[decisionUrgency(a)] || calculateDensityScore(a) - calculateDensityScore(b);
    }

    if (sortBy === "risk") {
      const riskRank = { Hög: 3, Medel: 2, Låg: 1 };
      return riskRank[b.retentionRisk] - riskRank[a.retentionRisk] || calculateDensityScore(a) - calculateDensityScore(b);
    }

    if (sortBy === "succession") {
      return a.successors - b.successors || calculateDensityScore(a) - calculateDensityScore(b);
    }

    return calculateDensityScore(a) - calculateDensityScore(b);
  });

  return sorted;
}

function normalizeLeaders(raw: unknown) {
  const defaults = createInitialLeaders();
  if (!Array.isArray(raw)) {
    return defaults;
  }

  return defaults.map((base) => {
    const stored = raw.find(
      (candidate): candidate is Partial<LeaderRecord> & { id: string } =>
        typeof candidate === "object" && candidate !== null && "id" in candidate && candidate.id === base.id
    );

    return stored
      ? {
          ...base,
          ...stored
        }
      : base;
  });
}

export function TalentDensityDashboard() {
  const [leaders, setLeaders] = useState<LeaderRecord[]>(() => createInitialLeaders());
  const [tab, setTab] = useState<(typeof tabs)[number]>("Beslutsrum");
  const [selectedArea, setSelectedArea] = useState("Alla");
  const [sortBy, setSortBy] = useState("decision");
  const [selectedLeaderId, setSelectedLeaderId] = useState(createInitialLeaders()[0]?.id ?? "");
  const [sessionNote, setSessionNote] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { leaders?: unknown; sessionNote?: string };
      const normalized = normalizeLeaders(parsed.leaders);
      setLeaders(normalized);
      setSelectedLeaderId(normalized[0]?.id ?? "");
      setSessionNote(typeof parsed.sessionNote === "string" ? parsed.sessionNote : "");
    } catch {
      // Ignore invalid local cache and use defaults.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ leaders, sessionNote }));
  }, [leaders, sessionNote]);

  const areas = useMemo(
    () => ["Alla", ...Array.from(new Set(leaders.map((leader) => leader.area)))],
    [leaders]
  );

  const filteredLeaders = useMemo(() => {
    const subset =
      selectedArea === "Alla"
        ? leaders
        : leaders.filter((leader) => leader.area === selectedArea);
    return sortLeaders(subset, sortBy);
  }, [leaders, selectedArea, sortBy]);

  const metrics = useMemo(() => portfolioMetrics(filteredLeaders), [filteredLeaders]);
  const selectedLeader =
    filteredLeaders.find((leader) => leader.id === selectedLeaderId) ?? filteredLeaders[0];

  const nineBoxGroups = useMemo(() => {
    const groups = new Map<string, LeaderRecord[]>();
    for (const leader of filteredLeaders) {
      groups.set(`${leader.performance}-${leader.potential}`, [
        ...(groups.get(`${leader.performance}-${leader.potential}`) ?? []),
        leader
      ]);
    }
    return groups;
  }, [filteredLeaders]);

  const benchRisks = filteredLeaders.filter(
    (leader) =>
      leader.replacementReadiness === "Ingen ersättare" ||
      leader.retentionRisk === "Hög" ||
      leader.executiveRecommendation === "Ersätt"
  );

  const commitments = filteredLeaders
    .filter(
      (leader) =>
        leader.decisionState !== "Ej beslutad" || leader.actionStatus !== "Ej startad"
    )
    .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate));

  const agenda = filteredLeaders.filter((leader) => decisionUrgency(leader) !== "Stabil");

  function updateLeader(id: string, patch: Partial<LeaderRecord>) {
    setLeaders((current) =>
      current.map((leader) =>
        leader.id === id
          ? {
              ...leader,
              ...patch,
              lastReviewed: new Date().toISOString().slice(0, 10)
            }
          : leader
      )
    );
  }

  function resetLeaders() {
    const next = createInitialLeaders();
    setLeaders(next);
    setSelectedLeaderId(next[0]?.id ?? "");
    setSessionNote("");
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function downloadSnapshot() {
    const blob = new Blob([exportSnapshot(leaders, sessionNote)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "talent-density-board-pack.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="execShell">
      <section className="topShell">
        <div className="titleBlock">
          <p className="kicker">Executive People Review System</p>
          <h1>Talent Density Decision Room</h1>
          <p className="subtitle">
            Systemet ska hjälpa rummet att skilja på evidens, tolkning, beslut och uppföljning.
            Inte bara sätta poäng.
          </p>
        </div>
        <div className="topActions">
          <button className="primaryButton" onClick={downloadSnapshot}>
            Exportera board pack
          </button>
          <button className="ghostButton" onClick={resetLeaders}>
            Återställ
          </button>
        </div>
      </section>

      <section className="headlineMetrics">
        <MetricCard label="Talent density" value={`${metrics.averageDensity}/100`} detail="Portföljens sammanvägda signal" />
        <MetricCard label="Pending decisions" value={String(metrics.decisionsPending)} detail="Ännu inte beslutade eller avslutade" />
        <MetricCard label="Low confidence" value={String(metrics.lowConfidenceCount)} detail="Kräver mer evidens eller benchmark" />
        <MetricCard label="No successor" value={String(metrics.noSuccessorCount)} detail="Roller med bench-gap" />
        <MetricCard label="Ready now" value={String(metrics.readyNowCount)} detail="Intern direkt ersättare finns" />
      </section>

      <section className="filtersBar">
        <div className="filtersGroup">
          <SelectField
            label="Portfölj"
            value={selectedArea}
            options={areas.map((value) => ({ value, label: value }))}
            onChange={setSelectedArea}
          />
          <SelectField
            label="Sortera på"
            value={sortBy}
            options={[
              { value: "decision", label: "Beslutsbrådska" },
              { value: "risk", label: "Retention risk" },
              { value: "succession", label: "Svagast bench först" },
              { value: "density", label: "Lägst density först" }
            ]}
            onChange={setSortBy}
          />
        </div>

        <div className="tabBar">
          {tabs.map((item) => (
            <button
              key={item}
              className={cn("tabButton", item === tab && "active")}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="boardGrid">
        <aside className="panel agendaPanel">
          <div className="panelHeader">
            <div>
              <p className="panelKicker">Agenda</p>
              <h2>Forumkö</h2>
            </div>
            <span>{filteredLeaders.length} roller</span>
          </div>

          <div className="agendaList">
            {filteredLeaders.map((leader) => {
              const score = calculateDensityScore(leader);
              const urgency = decisionUrgency(leader);
              return (
                <button
                  key={leader.id}
                  className={cn(
                    "agendaRow",
                    `tone-${getTone(score)}`,
                    selectedLeader?.id === leader.id && "selected"
                  )}
                  onClick={() => {
                    setSelectedLeaderId(leader.id);
                    setTab("Beslutsrum");
                  }}
                >
                  <div>
                    <strong>{leader.role}</strong>
                    <span>{leader.name}</span>
                  </div>
                  <div className="agendaMeta">
                    <strong>{urgency}</strong>
                    <span>{leader.executiveRecommendation}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="mainPanel">
          {tab === "Beslutsrum" && selectedLeader ? (
            <article className="panel">
              <div className="panelHeader">
                <div>
                  <p className="panelKicker">Active case</p>
                  <h2>
                    {selectedLeader.name} <span>{selectedLeader.role}</span>
                  </h2>
                </div>
                <div className={cn("signalBadge", `tone-${getTone(calculateDensityScore(selectedLeader))}`)}>
                  {calculateDensityScore(selectedLeader)} · {densityCategory(calculateDensityScore(selectedLeader))}
                </div>
              </div>

              <div className="caseSummary">
                <SummaryCell label="Urgency" value={decisionUrgency(selectedLeader)} />
                <SummaryCell label="Decision state" value={selectedLeader.decisionState} />
                <SummaryCell label="Confidence" value={selectedLeader.confidence} />
                <SummaryCell label="Evidence" value={selectedLeader.evidenceState} />
                <SummaryCell label="Retention risk" value={selectedLeader.retentionRisk} />
                <SummaryCell label="Succession" value={selectedLeader.replacementReadiness} />
              </div>

              <div className="stepGrid">
                <section className="stepCard">
                  <div className="stepHeader">
                    <span>01</span>
                    <h3>Evidens</h3>
                  </div>
                  <div className="compactGrid">
                    <SelectField
                      label="Performance"
                      value={String(selectedLeader.performance)}
                      options={[1, 2, 3, 4, 5].map((value) => ({
                        value: String(value),
                        label: `${value} · ${performanceLabel(value as Performance)}`
                      }))}
                      onChange={(value) =>
                        updateLeader(selectedLeader.id, { performance: Number(value) as Performance })
                      }
                    />
                    <SelectField
                      label="Potential"
                      value={String(selectedLeader.potential)}
                      options={[1, 2, 3, 4, 5].map((value) => ({
                        value: String(value),
                        label: `${value} · ${potentialLabel(value as Potential)}`
                      }))}
                      onChange={(value) =>
                        updateLeader(selectedLeader.id, { potential: Number(value) as Potential })
                      }
                    />
                    <SelectField
                      label="Evidence strength"
                      value={selectedLeader.evidenceState}
                      options={evidenceStateOptions.map((value) => ({ value, label: value }))}
                      onChange={(value) =>
                        updateLeader(selectedLeader.id, { evidenceState: value as EvidenceState })
                      }
                    />
                  </div>
                  <TextAreaField
                    label="Observed evidence"
                    value={selectedLeader.evidenceSummary}
                    placeholder="Vad vet vi faktiskt från output, beteenden, stakeholder-feedback och affärsresultat?"
                    onChange={(value) =>
                      updateLeader(selectedLeader.id, { evidenceSummary: value })
                    }
                  />
                </section>

                <section className="stepCard">
                  <div className="stepHeader">
                    <span>02</span>
                    <h3>Risk och tolkning</h3>
                  </div>
                  <div className="compactGrid">
                    <SelectField
                      label="Retention risk"
                      value={selectedLeader.retentionRisk}
                      options={flightRiskOptions.map((value) => ({ value, label: value }))}
                      onChange={(value) =>
                        updateLeader(selectedLeader.id, { retentionRisk: value as FlightRisk })
                      }
                    />
                    <SelectField
                      label="Succession"
                      value={selectedLeader.replacementReadiness}
                      options={readinessOptions.map((value) => ({ value, label: value }))}
                      onChange={(value) =>
                        updateLeader(selectedLeader.id, {
                          replacementReadiness: value as Readiness
                        })
                      }
                    />
                    <SelectField
                      label="Confidence"
                      value={selectedLeader.confidence}
                      options={confidenceOptions.map((value) => ({ value, label: value }))}
                      onChange={(value) =>
                        updateLeader(selectedLeader.id, { confidence: value as ConfidenceLevel })
                      }
                    />
                  </div>
                  <TextAreaField
                    label="Risk narrative"
                    value={selectedLeader.riskNarrative}
                    placeholder="Varför är detta ett problem eller en möjlighet för affären, inte bara för individen?"
                    onChange={(value) =>
                      updateLeader(selectedLeader.id, { riskNarrative: value })
                    }
                  />
                  <TextAreaField
                    label="Dissent / unresolved debate"
                    value={selectedLeader.dissentNote}
                    placeholder="Vilket motargument, vilken osäkerhet eller vilken konflikt kvarstår i rummet?"
                    onChange={(value) =>
                      updateLeader(selectedLeader.id, { dissentNote: value })
                    }
                  />
                </section>

                <section className="stepCard">
                  <div className="stepHeader">
                    <span>03</span>
                    <h3>Beslut</h3>
                  </div>
                  <div className="compactGrid">
                    <SelectField
                      label="Recommendation"
                      value={selectedLeader.executiveRecommendation}
                      options={decisionRecommendationOptions.map((value) => ({
                        value,
                        label: value
                      }))}
                      onChange={(value) =>
                        updateLeader(selectedLeader.id, {
                          executiveRecommendation: value as DecisionRecommendation
                        })
                      }
                    />
                    <SelectField
                      label="Decision state"
                      value={selectedLeader.decisionState}
                      options={decisionStateOptions.map((value) => ({ value, label: value }))}
                      onChange={(value) =>
                        updateLeader(selectedLeader.id, {
                          decisionState: value as DecisionState
                        })
                      }
                    />
                    <SelectField
                      label="Priority"
                      value={selectedLeader.calibrationPriority}
                      options={priorityOptions.map((value) => ({ value, label: value }))}
                      onChange={(value) =>
                        updateLeader(selectedLeader.id, {
                          calibrationPriority: value as CalibrationPriority
                        })
                      }
                    />
                  </div>
                </section>

                <section className="stepCard">
                  <div className="stepHeader">
                    <span>04</span>
                    <h3>Uppföljning</h3>
                  </div>
                  <div className="compactGrid">
                    <TextField
                      label="Decision owner"
                      value={selectedLeader.decisionOwner}
                      onChange={(value) =>
                        updateLeader(selectedLeader.id, { decisionOwner: value })
                      }
                    />
                    <TextField
                      label="Next review date"
                      type="date"
                      value={selectedLeader.nextReviewDate}
                      onChange={(value) =>
                        updateLeader(selectedLeader.id, { nextReviewDate: value })
                      }
                    />
                    <SelectField
                      label="Execution status"
                      value={selectedLeader.actionStatus}
                      options={actionStatusOptions.map((value) => ({ value, label: value }))}
                      onChange={(value) =>
                        updateLeader(selectedLeader.id, { actionStatus: value as ActionStatus })
                      }
                    />
                  </div>

                  <div className="signalGrid">
                    <SignalBar label="Performance" value={selectedLeader.performance * 20} />
                    <SignalBar label="Potential" value={selectedLeader.potential * 20} />
                    <SignalBar label="Values fit" value={selectedLeader.valuesFit} />
                    <SignalBar label="Leadership impact" value={selectedLeader.leadershipImpact} />
                    <SignalBar label="Criticality" value={selectedLeader.businessCriticality} />
                    <SignalBar label="Bench depth" value={selectedLeader.successors * 35} />
                  </div>
                </section>
              </div>
            </article>
          ) : null}

          {tab === "Portföljkarta" && (
            <article className="panel">
              <div className="panelHeader">
                <div>
                  <p className="panelKicker">Portfolio map</p>
                  <h2>9-box med beslutskontext</h2>
                </div>
              </div>

              <div className="nineBox">
                {[5, 4, 3, 2, 1].map((potential) =>
                  [1, 2, 3, 4, 5].map((performance) => {
                    const cellLeaders = nineBoxGroups.get(`${performance}-${potential}`) ?? [];
                    return (
                      <div key={`${performance}-${potential}`} className="nineCell">
                        <span className="cellLabel">
                          P{performance} / T{potential}
                        </span>
                        {cellLeaders.length === 0 ? (
                          <em>Tom</em>
                        ) : (
                          cellLeaders.map((leader) => (
                            <button
                              key={leader.id}
                              className="miniChip"
                              onClick={() => {
                                setSelectedLeaderId(leader.id);
                                setTab("Beslutsrum");
                              }}
                            >
                              {leader.name}
                            </button>
                          ))
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </article>
          )}

          {tab === "Bench risk" && (
            <article className="panel">
              <div className="panelHeader">
                <div>
                  <p className="panelKicker">Bench risk review</p>
                  <h2>Roller som måste de-riskas</h2>
                </div>
              </div>
              <div className="tableList">
                {benchRisks.map((leader) => (
                  <div key={leader.id} className="tableRow">
                    <div>
                      <strong>{leader.role}</strong>
                      <span>{leader.name}</span>
                    </div>
                    <div>
                      <strong>{leader.executiveRecommendation}</strong>
                      <span>Recommendation</span>
                    </div>
                    <div>
                      <strong>{leader.retentionRisk}</strong>
                      <span>Risk</span>
                    </div>
                    <div>
                      <strong>{leader.replacementReadiness}</strong>
                      <span>Bench</span>
                    </div>
                    <div>
                      <strong>{leader.nextReviewDate}</strong>
                      <span>Next review</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}

          {tab === "Åtaganden" && (
            <article className="panel">
              <div className="panelHeader">
                <div>
                  <p className="panelKicker">Commitments</p>
                  <h2>Beslut som måste följas upp</h2>
                </div>
              </div>
              <div className="tableList">
                {commitments.map((leader) => (
                  <div key={leader.id} className="tableRow">
                    <div>
                      <strong>{leader.name}</strong>
                      <span>{leader.role}</span>
                    </div>
                    <div>
                      <strong>{leader.decisionState}</strong>
                      <span>State</span>
                    </div>
                    <div>
                      <strong>{leader.actionStatus}</strong>
                      <span>Execution</span>
                    </div>
                    <div>
                      <strong>{leader.decisionOwner}</strong>
                      <span>Owner</span>
                    </div>
                    <div>
                      <strong>{leader.nextReviewDate}</strong>
                      <span>Review date</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}
        </section>

        <aside className="panel sideRail">
          <div className="panelHeader">
            <div>
              <p className="panelKicker">Room governance</p>
              <h2>Vad mötet ska lösa</h2>
            </div>
          </div>

          <div className="governanceList">
            {agenda.map((leader) => (
              <div key={leader.id} className="governanceItem">
                <strong>{leader.role}</strong>
                <span>
                  {decisionUrgency(leader)} · {leader.executiveRecommendation}
                </span>
              </div>
            ))}
          </div>

          <div className="policyCard">
            <h3>Kalibreringsregler</h3>
            <ul>
              <li>Separera observerad evidens från tolkning.</li>
              <li>Sätt inte “Beslutad” om owner eller review date saknas.</li>
              <li>Markera låg confidence när rummet inte är överens.</li>
            </ul>
          </div>

          <TextAreaField
            label="Session log"
            value={sessionNote}
            placeholder="Här ska bara det stå som behöver överleva mötet: oenigheter, beslut, ägarskap och datum."
            onChange={setSessionNote}
            rows={10}
          />
        </aside>
      </section>
    </main>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="inputField">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="inputField">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 5
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <label className="inputField fullWidth">
      <span>{label}</span>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function MetricCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="metricCard">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="summaryCell">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SignalBar({ label, value }: { label: string; value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="signalBar">
      <span>{label}</span>
      <strong>{safeValue}</strong>
      <div className="signalTrack">
        <div style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
