import {
  JobSpec,
  JobFormActionType,
  JobLabels,
  JobArtifact
} from "../helpers/JobFormData";

const updateLabels = (
  state: JobSpec,
  updateFn: (_: JobLabels) => JobLabels
) => ({
  ...state,
  job: {
    ...state.job,
    labels: updateFn(Array.isArray(state.job.labels) ? state.job.labels : [])
  }
});

const updateArtifacts = (
  state: JobSpec,
  updateFn: (_: JobArtifact[]) => JobArtifact[]
) => ({
  ...state,
  job: {
    ...state.job,
    run: {
      ...state.job.run,
      artifacts: updateFn(
        Array.isArray(state.job.run.artifacts) ? state.job.run.artifacts : []
      )
    }
  }
});

// TODO: refactor labels to Array<{key: string, value: string}>
// so this thing gets obsolete.
const updateTuple = <A, B>(
  [fst, snd]: [A, B],
  what: string,
  value: any
): [A, B] => {
  switch (what) {
    case "key":
      return [value, snd];
    case "value":
      return [fst, value];
    default:
      throw new Error(`can't update ${what} of $([fst, snd])`);
  }
};

const labels = {
  [JobFormActionType.AddArrayItem]: (_: string, state: JobSpec) =>
    updateLabels(state, labels => labels.concat([["", ""]])),
  [JobFormActionType.RemoveArrayItem]: (index: number, state: JobSpec) =>
    updateLabels(state, labels => [
      ...labels.slice(0, index),
      ...labels.slice(index + 1)
    ]),
  [JobFormActionType.Set]: (
    value: string,
    state: JobSpec,
    [what, indexS]: string[]
  ) => {
    const index = parseInt(indexS, 10);
    return updateLabels(state, labels =>
      labels.map((v, i) => (i === index ? updateTuple(v, what, value) : v))
    );
  }
};

const artifacts = {
  [JobFormActionType.AddArrayItem]: (_: string, state: JobSpec) =>
    updateArtifacts(state, artifacts => artifacts.concat([{ uri: "" }])),
  [JobFormActionType.RemoveArrayItem]: (index: number, state: JobSpec) =>
    updateArtifacts(state, artifacts => [
      ...artifacts.slice(0, index),
      ...artifacts.slice(index + 1)
    ]),
  [JobFormActionType.Set]: (
    value: string,
    state: JobSpec,
    [what, indexS]: string[]
  ) => {
    const index = parseInt(indexS, 10);
    return updateArtifacts(state, artifact =>
      artifact.map((v, i) => (i === index ? { ...v, [what]: value } : v))
    );
  }
};
export { artifacts, labels };
