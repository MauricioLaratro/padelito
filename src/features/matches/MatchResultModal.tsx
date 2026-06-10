import { X } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/forms/FormField";
import type { MatchWinnerSide } from "../../domain/enums/matchEnums";
import type { MatchRecord, MatchResult } from "../../domain/models/matchModels";
import { createCurrentIsoDate } from "../../utils/dateFormatters";

interface MatchResultModalProps {
  currentResult?: MatchResult;
  matchRecord: MatchRecord;
  onClose: () => void;
  onMatchResultRecord: (matchResult: MatchResult) => void;
}

/**
 * Modal de resultado de partido.
 * Se construye para finalizar partidos programados desde el perfil.
 * Lo usa MatchHistorySection.
 * Sirve para registrar marcador y alimentar estadisticas.
 */
export function MatchResultModal({
  currentResult,
  matchRecord,
  onClose,
  onMatchResultRecord,
}: MatchResultModalProps) {
  const [teamAScore, setTeamAScore] = useState(
    currentResult?.teamAScore ?? 6,
  );
  const [teamBScore, setTeamBScore] = useState(
    currentResult?.teamBScore ?? 4,
  );
  const [summary, setSummary] = useState(currentResult?.summary ?? "");

  /**
   * Guarda resultado del partido.
   * Se construye para producir un modelo de resultado completo.
   * Lo usa el submit del modal.
   * Sirve para cerrar el partido y calcular historial.
   */
  function handleResultSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();

    onMatchResultRecord({
      matchId: matchRecord.matchId,
      teamAScore,
      teamBScore,
      winnerSide: getWinnerSide(teamAScore, teamBScore),
      summary,
      recordedAt: createCurrentIsoDate(),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-black/70">
      <form
        className="w-full max-w-mobile rounded-t-2xl border border-border-subtle bg-background-secondary p-4 shadow-floating"
        onSubmit={handleResultSubmit}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-lime">
              Resultado
            </p>
            <h2 className="mt-1 text-2xl font-black">{matchRecord.placeText}</h2>
          </div>
          <button
            aria-label="Cerrar"
            className="grid size-10 place-items-center rounded-full border border-border-subtle bg-surface-secondary text-text-secondary"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Equipo A"
              min={0}
              onChange={(changeEvent) =>
                setTeamAScore(Number.parseInt(changeEvent.target.value, 10) || 0)
              }
              type="number"
              value={teamAScore}
            />
            <FormField
              label="Equipo B"
              min={0}
              onChange={(changeEvent) =>
                setTeamBScore(Number.parseInt(changeEvent.target.value, 10) || 0)
              }
              type="number"
              value={teamBScore}
            />
          </div>
          <FormField
            fieldType="textarea"
            label="Resumen"
            onChange={(changeEvent) => setSummary(changeEvent.target.value)}
            value={summary}
          />
        </div>

        <Button className="mt-5 w-full" type="submit" variant="primary">
          Guardar resultado
        </Button>
      </form>
    </div>
  );
}

/**
 * Calcula ganador desde marcador.
 * Se construye para mantener resultado consistente.
 * Lo usa MatchResultModal.
 * Sirve para alimentar estadisticas por lado.
 */
function getWinnerSide(
  teamAScore: number,
  teamBScore: number,
): MatchWinnerSide {
  if (teamAScore > teamBScore) {
    return "team_a";
  }

  if (teamBScore > teamAScore) {
    return "team_b";
  }

  return "draw";
}
