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
const tabs = ["Kalibreringsrum", "9-box", "Succession", "Actions"] as const;

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
  const [tab, setTab] = useState<(typeof tabs)[number]>("Kalibreringsrum");
  const [selectedArea, setSelectedArea] = useState("Alla");
  const [sortBy, setSortBy] = useState("density");
  const [selectedLeaderId, setSelectedLeaderId] = useState(createInitialLeaders()[0]?.id ?? "");
  const [sessionNote, setSessionNote] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { leaders: LeaderRecord[]; sessionNote?: string };
        if (Array.isArray(parsed.leaders) && parsed.leaders.length > 0) {
          setLeaders(parsed.leaders);
          setSelectedLeaderId(parsed.leaders[0]?.id ?? "");
          setSessionNote(parsed.sessionNote ?? "");
        }
      }
    } catch {
      // Ignore corrupted local state and fall back to defaults.
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
    .slice(0, 8);

  const meetingQueue = filteredLeaders.filter(
    (leader) =>
      leader.calibrationPriority === "Nu" ||
      leader.retentionRisk === "Hög" ||
      leader.replacementReadiness === "Ingen ersättare"
  );

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
    const blob = new Blob([exportSnapshot(leaders)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "talent-density-snapshot.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="execShell">
      <section className="commandBar">
        <div className="commandIdentity">
          <p className="commandEyebrow">Executive Calibration Console</p>
          <h1>Talent Density</h1>
          <p className="commandSubline">
            Ett kalibreringsrum för ledningsgrupper som måste fatta svåra people-beslut med
            tempo, disciplin och tydlig ägarsättning.
          </p>
        </div>

        <div className="commandActions">
          <button className="primaryButton" onClick={downloadSnapshot}>
            Exportera board pack
          </button>
          <button className="ghostButton" onClick={resetLeaders}>
            Återställ session
          </button>
        </div>
      </section>

      <section className="statusStrip">
        <StatusTile label="Portföljscore" value={`${metrics.averageDensity}/100`} detail="Samlad talent density" />
        <StatusTile label="Akuta luckor" value={String(metrics.noSuccessorCount)} detail="Roller utan ersättare" />
        <StatusTile label="Hög flight risk" value={String(metrics.highRiskCount)} detail="Måste adresseras i rummet" />
        <StatusTile
          label="Bench coverage"
          value={`${Math.round(
            (filteredLeaders.filter((leader) => leader.successors > 0).length /
              filteredLeaders.length) *
              100
          )}%`}
          detail="Roller med minst en kandidat"
        />
        <StatusTile label="Redo nu" value={String(metrics.readyNowCount)} detail="Direkt succession" />
      </section>

      <section className="controlRail">
        <div className="controlCluster">
          <SelectField
            label="Portfölj"
            value={selectedArea}
            options={areas.map((value) => ({ value, label: value }))}
            onChange={setSelectedArea}
          />
          <SelectField
            label="Sortering"
            value={sortBy}
            options={[
              { value: "density", label: "Talent density" },
              { value: "risk", label: "Retention risk" },
              { value: "succession", label: "Svagast succession först" }
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

      <section className="workbench">
        <aside className="card rosterPanel">
          <div className="panelHeader">
            <div>
              <p className="panelEyebrow">Roster</p>
              <h2>Kalibreringskö</h2>
            </div>
            <span className="smallMeta">{filteredLeaders.length} ledare</span>
          </div>

          <div className="rosterList">
            {filteredLeaders.map((leader) => {
              const score = calculateDensityScore(leader);
              return (
                <button
                  key={leader.id}
                  className={cn(
                    "rosterRow",
                    `tone-${getTone(score)}`,
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
                  <div className="rosterMeta">
                    <strong>{score}</strong>
                    <span>{leader.calibrationPriority}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="centerColumn">
          {tab === "Kalibreringsrum" && selectedLeader ? (
            <article className="card calibrationPanel">
              <div className="panelHeader">
                <div>
                  <p className="panelEyebrow">Aktiv kalibrering</p>
                  <h2>{selectedLeader.name}</h2>
                </div>
                <div className={cn("badge", `tone-${getTone(calculateDensityScore(selectedLeader))}`)}>
                  {calculateDensityScore(selectedLeader)} · {densityCategory(calculateDensityScore(selectedLeader))}
                </div>
              </div>

              <div className="decisionStrip">
                <DecisionStat label="Roll" value={selectedLeader.role} />
                <DecisionStat label="Retention risk" value={selectedLeader.retentionRisk} />
                <DecisionStat label="Succession" value={selectedLeader.replacementReadiness} />
                <DecisionStat label="Senast" value={selectedLeader.lastReviewed} />
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

              <div className="signalGrid">
                <ScorePill label="Performance" value={selectedLeader.performance * 20} />
                <ScorePill label="Potential" value={selectedLeader.potential * 20} />
                <ScorePill label="Värdepassning" value={selectedLeader.valuesFit} />
                <ScorePill label="Leadership impact" value={selectedLeader.leadershipImpact} />
                <ScorePill label="Kritikalitet" value={selectedLeader.businessCriticality} />
                <ScorePill label="Bench signal" value={selectedLeader.successors * 35} />
              </div>

              <div className="notesGrid">
                <div className="textFieldGroup">
                  <label htmlFor="action-owner">Beslutsägare</label>
                  <input
                    id="action-owner"
                    value={selectedLeader.actionOwner}
                    onChange={(event) =>
                      updateLeader(selectedLeader.id, { actionOwner: event.target.value })
                    }
                  />
                </div>

                <div className="textFieldGroup">
                  <label htmlFor="calibration-note">Kalibreringsbeslut</label>
                  <textarea
                    id="calibration-note"
                    rows={8}
                    value={selectedLeader.calibrationNote}
                    onChange={(event) =>
                      updateLeader(selectedLeader.id, { calibrationNote: event.target.value })
                    }
                    placeholder="Skriv vad ledningsgruppen faktiskt beslutade, vad som måste följas upp och vilket motargument som kvarstår."
                  />
                </div>
              </div>

              <div className="comparisonGrid">
                <div className="listPanel">
                  <h3>Det som talar för</h3>
                  <ul>
                    {selectedLeader.strengths.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="listPanel">
                  <h3>Det som måste adresseras</h3>
                  <ul>
                    {selectedLeader.gaps.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="listPanel">
                  <h3>Föreslagna nästa steg</h3>
                  <ul>
                    {selectedLeader.actions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ) : null}

          {tab === "9-box" && (
            <article className="card matrixCard">
              <div className="panelHeader">
                <div>
                  <p className="panelEyebrow">Portfolio mapping</p>
                  <h2>9-box kalibrering</h2>
                </div>
                <span className="smallMeta">Potential lodrätt, performance vågrätt</span>
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
                                setTab("Kalibreringsrum");
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

          {tab === "Succession" && (
            <article className="card denseTableCard">
              <div className="panelHeader">
                <div>
                  <p className="panelEyebrow">Critical bench review</p>
                  <h2>Succession pressure points</h2>
                </div>
              </div>
              <div className="denseTable">
                {successionGaps.map((leader) => (
                  <div key={leader.id} className="denseRow">
                    <div>
                      <strong>{leader.role}</strong>
                      <span>{leader.name}</span>
                    </div>
                    <div>
                      <strong>{leader.replacementReadiness}</strong>
                      <span>Readiness</span>
                    </div>
                    <div>
                      <strong>{leader.retentionRisk}</strong>
                      <span>Risk</span>
                    </div>
                    <div>
                      <strong>{leader.successors}</strong>
                      <span>Successors</span>
                    </div>
                    <div>
                      <strong>{leader.actionOwner}</strong>
                      <span>Owner</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}

          {tab === "Actions" && (
            <article className="card denseTableCard">
              <div className="panelHeader">
                <div>
                  <p className="panelEyebrow">Execution governance</p>
                  <h2>Prioriterade actions</h2>
                </div>
              </div>
              <div className="denseTable">
                {topActions.map((leader) => (
                  <div key={leader.id} className="denseRow">
                    <div>
                      <strong>{leader.name}</strong>
                      <span>{leader.role}</span>
                    </div>
                    <div>
                      <strong>{leader.calibrationPriority}</strong>
                      <span>Prioritet</span>
                    </div>
                    <div>
                      <strong>{leader.actionStatus}</strong>
                      <span>Status</span>
                    </div>
                    <div>
                      <strong>{leader.actionOwner}</strong>
                      <span>Ägare</span>
                    </div>
                    <div>
                      <strong>{leader.lastReviewed}</strong>
                      <span>Senast uppdaterad</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}
        </section>

        <aside className="card decisionPanel">
          <div className="panelHeader">
            <div>
              <p className="panelEyebrow">Decision rail</p>
              <h2>Vad rummet måste lösa</h2>
            </div>
          </div>

          <div className="decisionQueue">
            {meetingQueue.map((leader) => (
              <div key={leader.id} className="queueItem">
                <strong>{leader.role}</strong>
                <span>
                  {leader.retentionRisk} risk · {leader.replacementReadiness}
                </span>
              </div>
            ))}
          </div>

          <div className="textFieldGroup">
            <label htmlFor="session-note">Möteslogg</label>
            <textarea
              id="session-note"
              rows={10}
              value={sessionNote}
              onChange={(event) => setSessionNote(event.target.value)}
              placeholder="Skriv det som behöver kvarstå mellan HR, VD och styrelse: oenigheter, beslut, beroenden och öppna frågor."
            />
          </div>

          <div className="listPanel compact">
            <h3>Kalibreringsprinciper</h3>
            <ul>
              <li>Separera faktisk output från framtida potential.</li>
              <li>Sätt inte låg bench-risk på roller utan namngiven successor.</li>
              <li>Markera bara “Klar” när ett faktiskt beslut är ägt och tidssatt.</li>
            </ul>
          </div>
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

function StatusTile({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="statusTile">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function DecisionStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="decisionStat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="scorePill">
      <span>{label}</span>
      <strong>{value}</strong>
      <div className="scoreBar">
        <div style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}
