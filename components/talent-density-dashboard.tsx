"use client";

import { useEffect, useMemo, useState } from "react";
import {
  actionStatusOptions,
  calculateDensityScore,
  createInitialLeaders,
  densityCategory,
  exportSnapshot,
  flightRiskOptions,
  performanceLabel,
  portfolioMetrics,
  potentialLabel,
  priorityOptions,
  readinessOptions,
  type ActionStatus,
  type CalibrationPriority,
  type FlightRisk,
  type LeaderRecord,
  type Performance,
  type Potential,
  type Readiness
} from "@/lib/talent-density-data";

const STORAGE_KEY = "talent-density-tool.v2";
const tabs = ["Översikt", "Kalibrering", "9-box", "Succession", "Actions"] as const;

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
    const scoreDiff = calculateDensityScore(b) - calculateDensityScore(a);

    if (sortBy === "risk") {
      const riskRank = { Hög: 3, Medel: 2, Låg: 1 };
      return riskRank[b.retentionRisk] - riskRank[a.retentionRisk] || scoreDiff;
    }

    if (sortBy === "succession") {
      return a.successors - b.successors || scoreDiff;
    }

    return scoreDiff;
  });

  return sorted;
}

export function TalentDensityDashboard() {
  const [leaders, setLeaders] = useState<LeaderRecord[]>(() => createInitialLeaders());
  const [tab, setTab] = useState<(typeof tabs)[number]>("Översikt");
  const [selectedArea, setSelectedArea] = useState("Alla");
  const [sortBy, setSortBy] = useState("density");
  const [selectedLeaderId, setSelectedLeaderId] = useState(createInitialLeaders()[0]?.id ?? "");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LeaderRecord[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLeaders(parsed);
          setSelectedLeaderId(parsed[0]?.id ?? "");
        }
      }
    } catch {
      // Ignore corrupted local state and fall back to defaults.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leaders));
  }, [leaders]);

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
  }, [selectedArea, sortBy]);

  const metrics = useMemo(() => portfolioMetrics(filteredLeaders), [filteredLeaders]);
  const selectedLeader =
    filteredLeaders.find((leader) => leader.id === selectedLeaderId) ?? filteredLeaders[0];

  const actionBoard = filteredLeaders
    .filter(
      (leader) =>
        leader.retentionRisk === "Hög" ||
        leader.replacementReadiness === "Ingen ersättare" ||
        calculateDensityScore(leader) < 72
    )
    .slice(0, 4);

  const nineBoxGroups = useMemo(() => {
    const groups = new Map<string, LeaderRecord[]>();
    for (const leader of filteredLeaders) {
      const key = `${leader.performance}-${leader.potential}`;
      groups.set(key, [...(groups.get(key) ?? []), leader]);
    }
    return groups;
  }, [filteredLeaders]);

  const successionGaps = filteredLeaders
    .filter(
      (leader) =>
        leader.replacementReadiness === "Ingen ersättare" || leader.retentionRisk === "Hög"
    )
    .sort((a, b) => calculateDensityScore(a) - calculateDensityScore(b));

  const topActions = filteredLeaders
    .filter((leader) => leader.calibrationPriority !== "Bevaka")
    .sort((a, b) => {
      const priorityRank = { Nu: 3, Kvartal: 2, Bevaka: 1 };
      const statusRank = { "Ej startad": 3, Pågår: 2, Klar: 1 };
      return (
        priorityRank[b.calibrationPriority] - priorityRank[a.calibrationPriority] ||
        statusRank[b.actionStatus] - statusRank[a.actionStatus] ||
        calculateDensityScore(a) - calculateDensityScore(b)
      );
    })
    .slice(0, 6);

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
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function downloadSnapshot() {
    const blob = new Blob([exportSnapshot(leaders)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "talent-density-snapshot.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Talent Density OS</p>
          <h1>Ledningsverktyg för att kalibrera, prioritera och höja talent density.</h1>
          <p className="lead">
            Byggt för ledningsgrupper som vill se mer än performance: bench strength,
            flight risk, värdepassning, succession och konkreta åtgärder i samma vy.
          </p>
          <div className="heroActions">
            <button className="primaryButton" onClick={() => setTab("Kalibrering")}>
              Öppna kalibrering
            </button>
            <button className="ghostButton" onClick={downloadSnapshot}>
              Exportera snapshot
            </button>
          </div>
        </div>
        <div className="heroCard">
          <span>Portföljstatus</span>
          <strong>{metrics.averageDensity}/100</strong>
          <p>Genomsnittlig talent density i vald ledningsportfölj.</p>
        </div>
      </section>

      <section className="tabBar">
        {tabs.map((item) => (
          <button
            key={item}
            className={cn("tabButton", item === tab && "active")}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </section>

      <section className="toolbar card">
        <div className="field">
          <label htmlFor="area">Område</label>
          <select
            id="area"
            value={selectedArea}
            onChange={(event) => setSelectedArea(event.target.value)}
          >
            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="sort">Sortera</label>
          <select
            id="sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="density">Talent density</option>
            <option value="risk">Retention risk</option>
            <option value="succession">Svagast succession först</option>
          </select>
        </div>
        <div className="summaryBlock">
          <span>Redo nu</span>
          <strong>{metrics.readyNowCount}</strong>
        </div>
        <div className="summaryBlock">
          <span>Ingen ersättare</span>
          <strong>{metrics.noSuccessorCount}</strong>
        </div>
        <div className="summaryBlock">
          <span>Hög retention risk</span>
          <strong>{metrics.highRiskCount}</strong>
        </div>
        <div className="toolbarActions">
          <button className="ghostButton small" onClick={resetLeaders}>
            Återställ
          </button>
        </div>
      </section>

      <section className="metricsGrid">
        <article className="card metricCard">
          <span>Talent density</span>
          <strong>{metrics.averageDensity}</strong>
          <p>Samlad score viktad på performance, potential, värdepassning, impact och bench.</p>
        </article>
        <article className="card metricCard">
          <span>Bench coverage</span>
          <strong>
            {Math.round(
              (filteredLeaders.filter((leader) => leader.successors > 0).length /
                filteredLeaders.length) *
                100
            )}
            %
          </strong>
          <p>Andel roller där det finns minst en intern ersättarkandidat.</p>
        </article>
        <article className="card metricCard">
          <span>Värdepassning</span>
          <strong>
            {Math.round(
              filteredLeaders.reduce((sum, leader) => sum + leader.valuesFit, 0) /
                filteredLeaders.length
            )}
          </strong>
          <p>Ger signal om kulturfriktion innan den syns fullt ut i resultatet.</p>
        </article>
        <article className="card metricCard">
          <span>Operativ sårbarhet</span>
          <strong>
            {Math.round(
              filteredLeaders.reduce(
                (sum, leader) =>
                  sum +
                  (leader.businessCriticality -
                    (leader.replacementReadiness === "Redo nu"
                      ? 45
                      : leader.replacementReadiness === "Redo inom 12 månader"
                        ? 20
                        : 0)),
                0
              ) / filteredLeaders.length
            )}
          </strong>
          <p>Hög kritikalitet kombinerad med låg succession driver upp sårbarheten.</p>
        </article>
      </section>

      {(tab === "Översikt" || tab === "Kalibrering") && (
        <section className="contentGrid">
          <article className="card tableCard">
            <div className="sectionHeader">
              <div>
                <p className="eyebrow">Kalibrering</p>
                <h2>Ledningsgruppens talent map</h2>
              </div>
              <p className="muted">
                Klicka på en ledare för att uppdatera score, risk, prioritet och notering.
              </p>
            </div>

            <div className="leaderList">
              {filteredLeaders.map((leader) => {
                const score = calculateDensityScore(leader);
                const tone = getTone(score);
                return (
                  <button
                    key={leader.id}
                    className={cn(
                      "leaderRow",
                      `tone-${tone}`,
                      selectedLeader?.id === leader.id && "selected"
                    )}
                    onClick={() => setSelectedLeaderId(leader.id)}
                  >
                    <div>
                      <strong>{leader.name}</strong>
                      <span>
                        {leader.role} · {leader.area}
                      </span>
                    </div>
                    <div className="rowMeta">
                      <span>
                        {densityCategory(score)} · {leader.calibrationPriority}
                      </span>
                      <strong>{score}</strong>
                    </div>
                  </button>
                );
              })}
            </div>
          </article>

          {selectedLeader ? (
            <article className="card profileCard">
              <div className="sectionHeader">
                <div>
                  <p className="eyebrow">Fördjupning</p>
                  <h2>{selectedLeader.name}</h2>
                </div>
                <div
                  className={cn(
                    "badge",
                    `tone-${getTone(calculateDensityScore(selectedLeader))}`
                  )}
                >
                  {calculateDensityScore(selectedLeader)} /{" "}
                  {densityCategory(calculateDensityScore(selectedLeader))}
                </div>
              </div>

              <div className="profileMeta">
                <div>
                  <span>Roll</span>
                  <strong>{selectedLeader.role}</strong>
                </div>
                <div>
                  <span>Anställningstid</span>
                  <strong>{selectedLeader.tenureYears} år</strong>
                </div>
                <div>
                  <span>Retention risk</span>
                  <strong>{selectedLeader.retentionRisk}</strong>
                </div>
                <div>
                  <span>Succession</span>
                  <strong>{selectedLeader.replacementReadiness}</strong>
                </div>
              </div>

              <div className="radarGrid">
                <ScorePill label="Performance" value={selectedLeader.performance * 20} />
                <ScorePill label="Potential" value={selectedLeader.potential * 20} />
                <ScorePill label="Värdepassning" value={selectedLeader.valuesFit} />
                <ScorePill label="Leadership impact" value={selectedLeader.leadershipImpact} />
                <ScorePill label="Kritikalitet" value={selectedLeader.businessCriticality} />
              </div>

              <div className="editorGrid">
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
                  label="Prioritet"
                  value={selectedLeader.calibrationPriority}
                  options={priorityOptions.map((value) => ({ value, label: value }))}
                  onChange={(value) =>
                    updateLeader(selectedLeader.id, {
                      calibrationPriority: value as CalibrationPriority
                    })
                  }
                />
                <SelectField
                  label="Status"
                  value={selectedLeader.actionStatus}
                  options={actionStatusOptions.map((value) => ({ value, label: value }))}
                  onChange={(value) =>
                    updateLeader(selectedLeader.id, { actionStatus: value as ActionStatus })
                  }
                />
              </div>

              <div className="textFieldGroup">
                <label htmlFor="action-owner">Action owner</label>
                <input
                  id="action-owner"
                  value={selectedLeader.actionOwner}
                  onChange={(event) =>
                    updateLeader(selectedLeader.id, { actionOwner: event.target.value })
                  }
                />
              </div>

              <div className="textFieldGroup">
                <label htmlFor="calibration-note">Kalibreringsnotering</label>
                <textarea
                  id="calibration-note"
                  rows={5}
                  value={selectedLeader.calibrationNote}
                  onChange={(event) =>
                    updateLeader(selectedLeader.id, { calibrationNote: event.target.value })
                  }
                  placeholder="Skriv beslut, riskhypotes, ägarskap eller nästa steg."
                />
              </div>

              <div className="twoCol">
                <div>
                  <h3>Styrkor</h3>
                  <ul>
                    {selectedLeader.strengths.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Gaps</h3>
                  <ul>
                    {selectedLeader.gaps.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h3>Rekommenderade actions</h3>
                <ul>
                  {selectedLeader.actions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>
          ) : null}
        </section>
      )}

      {(tab === "Översikt" || tab === "9-box") && (
        <section className="card matrixCard">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">9-box</p>
              <h2>Performance × potential</h2>
            </div>
            <p className="muted">Varje ruta visar vilka ledare som just nu ligger i respektive cell.</p>
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
                            setTab("Kalibrering");
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
        </section>
      )}

      {(tab === "Översikt" || tab === "Succession") && (
        <section className="bottomGrid">
          <article className="card">
            <div className="sectionHeader">
              <div>
                <p className="eyebrow">Risk & succession</p>
                <h2>Kritiska luckor</h2>
              </div>
            </div>
            <div className="riskMatrix">
              {successionGaps.map((leader) => (
                <div key={leader.id} className="riskCell">
                  <div className={cn("riskDot", leader.retentionRisk === "Hög" && "isHigh")} />
                  <div>
                    <strong>{leader.role}</strong>
                    <span>
                      {leader.retentionRisk} risk · {leader.replacementReadiness}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="card">
            <div className="sectionHeader">
              <div>
                <p className="eyebrow">Action board</p>
                <h2>90-dagars prioriteringar</h2>
              </div>
            </div>
            <div className="actionBoard">
              {actionBoard.map((leader) => (
                <div key={leader.id} className="actionCard">
                  <span>{leader.role}</span>
                  <strong>{leader.name}</strong>
                  <p>
                    {leader.retentionRisk === "Hög"
                      ? "Akut retention- och stabilitetsrisk."
                      : leader.replacementReadiness === "Ingen ersättare"
                        ? "Saknar bench för kritisk roll."
                        : "Behöver riktad utvecklingsinsats för att lyfta density."}
                  </p>
                  <ul>
                    {leader.actions.slice(0, 2).map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {(tab === "Översikt" || tab === "Actions") && (
        <section className="card actionTableCard">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">Execution</p>
              <h2>Ägda insatser</h2>
            </div>
            <p className="muted">Visar vilka åtgärder som bör ägas nu, av vem och om de rör sig framåt.</p>
          </div>
          <div className="actionTable">
            {topActions.map((leader) => (
              <div key={leader.id} className="actionRow">
                <div>
                  <strong>{leader.name}</strong>
                  <span>
                    {leader.role} · {leader.calibrationPriority}
                  </span>
                </div>
                <div>
                  <strong>{leader.actionOwner}</strong>
                  <span>Owner</span>
                </div>
                <div>
                  <strong>{leader.actionStatus}</strong>
                  <span>Status</span>
                </div>
                <div>
                  <strong>{leader.lastReviewed}</strong>
                  <span>Senast uppdaterad</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="scorePill">
      <span>{label}</span>
      <strong>{value}</strong>
      <div className="scoreBar">
        <div style={{ width: `${value}%` }} />
      </div>
    </div>
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
    <div className="field">
      <label>{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
