export interface JobFormData {
  id: string;
  description?: string;
  labels?: JobLabels;
  run: JobRun;
}

export enum ConcurrentPolicy {
  Allow = "ALLOW",
  Forbid = "FORBID"
}

export interface JobSchedule {
  id: string;
  cron: string;
  timezone?: string;
  startingDeadlineSeconds?: number;
  concurrentPolicy?: ConcurrentPolicy;
  enabled?: boolean;
}

export enum Container {
  Docker = "docker",
  UCR = "ucr"
}

export interface JobSpec {
  cmdOnly: boolean;
  container?: Container | null;
  job: JobFormData;
  schedule?: JobSchedule;
}

export interface FormOutput {
  jobId: string;
  description?: string;
  cmdOnly: boolean;
  cmd?: string;
  container?: Container | null;
  containerImage?: string;
  imageForcePull?: boolean;
  grantRuntimePrivileges?: boolean;
  cpus: number;
  gpus?: number;
  mem: number;
  disk: number;
  dockerParams: DockerParameter[];
  args: string[];
  maxLaunchDelay?: number;
  killGracePeriod?: number;
  user?: string;
  restartJob?: boolean;
  retryTime?: number;
  labels?: JobLabels;
  artifacts?: JobArtifact[];
}

export interface JobOutput {
  job: JobFormData;
  schedule?: JobSchedule;
}

export type JobLabels = Array<[string, string]>;

export interface JobRun {
  args?: string[];
  artifacts?: JobArtifact[];
  cmd?: string;
  cpus: number;
  gpus?: number;
  disk: number;
  ucr?: UcrContainer;
  docker?: DockerContainer;
  env?: JobEnv;
  maxLaunchDelay?: number;
  mem: number;
  placement?: JobPlacement;
  user?: string;
  taskKillGracePeriodSeconds?: number;
  restart?: JobRestart;
  activeDeadlineSeconds?: number;
  volumes?: Array<JobVolume | SecretVolume>;
  restartJob?: boolean;
  retryTime?: number;
  secrets?: {
    [key: string]: FileBasedSecret;
  };
}

export interface JobArtifact {
  uri: string;
  executable?: boolean;
  extract?: boolean;
  cache?: boolean;
}

export interface UcrContainer {
  image: UcrImage;
  privileged?: boolean;
}

export enum UcrImageKind {
  Docker = "docker",
  Appc = "appc"
}

export interface UcrImage {
  id: string;
  kind?: UcrImageKind;
  forcePull?: boolean;
}

export interface DockerContainer {
  image: string;
  forcePullImage?: boolean;
  privileged?: boolean;
  parameters?: DockerParameter[];
}

export interface DockerParameter {
  key: string;
  value: string;
}

export interface JobEnv {
  [key: string]: string | EnvBasedSecret;
}

export interface EnvBasedSecret {
  secret: string;
}

export interface JobPlacement {
  constraints: PlacementConstraint[];
}

export enum ConstraintOperator {
  Eq = "EQ",
  Like = "LIKE",
  Unlike = "UNLIKE"
}
export interface PlacementConstraint {
  attribute: string;
  operator: ConstraintOperator;
  value?: string;
}

export enum RestartPolicy {
  Never = "NEVER",
  OnFailure = "ON_FAILURE"
}

export interface JobRestart {
  policy: RestartPolicy;
  activeDeadlineSeconds?: number;
}

export enum VolumeMode {
  RO = "RO",
  RW = "RW"
}

export interface JobVolume {
  containerPath: string;
  hostPath: string;
  mode?: VolumeMode;
}

export interface SecretVolume {
  containerPath: string;
  secret: string;
}

export interface FileBasedSecret {
  source: string;
}

export interface FormError {
  message: string;
  path: string[];
  isPermissive?: boolean;
}

export enum JobFormActionType {
  Set = "SET",
  SetNum = "SET_NUM",
  SetBool = "SET_BOOL",
  Override = "OVERRIDE",
  AddArrayItem = "ADD_ARRAY_ITEM",
  RemoveArrayItem = "REMOVE_ARRAY_ITEM"
}

export interface Action {
  path: string;
  type: JobFormActionType;
  value: any;
}
