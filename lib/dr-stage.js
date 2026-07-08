const DR_STAGES = ["No DR", "Mild", "Moderate", "Severe", "Proliferative DR"]

export function getDRStageNumber(grade) {
  const idx = DR_STAGES.indexOf(grade)
  return idx === -1 ? null : idx
}

export function formatGradeWithStage(grade) {
  if (!grade) return grade
  const stage = getDRStageNumber(grade)
  return stage === null ? grade : `${grade} (Stage ${stage})`
}
