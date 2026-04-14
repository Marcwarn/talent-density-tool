"use client";

import { useMemo, useState } from "react";
import {
  calculateDensityScore,
  densityCategory,
  leaders,
  portfolioMetrics,
  type Leader
} from "@/lib/talent-density-data";

const areas = ["Alla", ...Array.from(new Set(leaders.map((leader) => leader.area)))];

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function getTone(score: number) {
  if (score >= 85) return "excellent";
  if (score >= 72) return "strong";
  if (score >= 58) return "watch";
  return "risk";
}

function sortLeaders(data: Leader[], sortBy: string) {
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
  const [selectedArea, setSelectedArea] = useState("Alla");
  const [sortBy, setSortBy] = useState("density");
  const [selectedLeaderId, setSelectedLeaderId] = useState(leaders[0]?.id ?? "");

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
        </div>
        <div className="heroCard">
          <span>Portföljstatus</span>
          <strong>{metrics.averageDensity}/100</strong>
          <p>Genomsnittlig talent density i vald ledningsportfölj.</p>
        </div>
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

      <section className="contentGrid">
        <article className="card tableCard">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">Kalibrering</p>
              <h2>Ledningsgruppens talent map</h2>
            </div>
            <p className="muted">Klicka på en ledare för fördjupad vy och rekommenderade insatser.</p>
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
                    <span>{densityCategory(score)}</span>
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
              <div className={cn("badge", `tone-${getTone(calculateDensityScore(selectedLeader))}`)}>
                {calculateDensityScore(selectedLeader)} / {densityCategory(calculateDensityScore(selectedLeader))}
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

      <section className="bottomGrid">
        <article className="card">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">Risk & succession</p>
              <h2>Kritiska luckor</h2>
            </div>
          </div>
          <div className="riskMatrix">
            {filteredLeaders.map((leader) => (
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
