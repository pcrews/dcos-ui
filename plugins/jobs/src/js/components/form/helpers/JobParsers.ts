import { deepCopy, findNestedPropertyInObject } from "#SRC/js/utils/Util";

import {
  Container,
  DockerParameter,
  FormOutput,
  JobOutput,
  JobSpec
} from "./JobFormData";

export function jobSpecToOutputParser(jobSpec: JobSpec): JobOutput {
  const jobSpecCopy = deepCopy(jobSpec);
  if (jobSpecCopy.job && jobSpecCopy.job.run) {
    if (jobSpecCopy.job.run.gpus === "") {
      delete jobSpecCopy.job.run.gpus;
    }
    if (jobSpecCopy.cmdOnly) {
      delete jobSpecCopy.job.run.docker;
      delete jobSpecCopy.job.run.ucr;
      delete jobSpecCopy.job.run.gpus;
      delete jobSpecCopy.job.run.args;
    } else if (jobSpecCopy.container) {
      if (jobSpecCopy.job.run.cmd === "") {
        // You are allowed to run a job with a container and no command, but
        // the API will return an error if `cmd` is in the object but does not have
        // a minimum length of one.
        delete jobSpecCopy.job.run.cmd;
      }
      const container = jobSpecCopy.job.run[jobSpecCopy.container];
      delete jobSpecCopy.job.run.docker;
      delete jobSpecCopy.job.run.ucr;
      jobSpecCopy.job.run[jobSpecCopy.container] = container;
      if (jobSpecCopy.container !== Container.UCR) {
        delete jobSpecCopy.job.run.gpus;
      }
      if (jobSpecCopy.container !== Container.Docker) {
        delete jobSpecCopy.job.run.args;
      }
      if (jobSpecCopy.container === Container.Docker) {
        if (jobSpecCopy.job.run.docker.parameters) {
          const filteredParams = Array.isArray(
            jobSpecCopy.job.run.docker.parameters
          )
            ? jobSpecCopy.job.run.docker.parameters.filter(
                (param: DockerParameter) => param.key || param.value
              )
            : [];
          if (filteredParams.length) {
            jobSpecCopy.job.run.docker.parameters = filteredParams;
          } else {
            delete jobSpecCopy.job.run.docker.parameters;
          }
        }
        if (jobSpecCopy.job.run.args) {
          const filteredArgs = Array.isArray(jobSpecCopy.job.run.args)
            ? jobSpecCopy.job.run.args.filter((arg: string) => !!arg)
            : [];
          if (filteredArgs.length) {
            jobSpecCopy.job.run.args = filteredArgs;
          } else {
            delete jobSpecCopy.job.run.args;
          }
        }
      }
    }

    // RUN CONFIG
    const artifacts = findNestedPropertyInObject(
      jobSpecCopy,
      "job.run.artifacts"
    );
    if (artifacts && Array.isArray(artifacts)) {
      jobSpecCopy.job.run.artifacts = artifacts.filter(
        artifact =>
          !(
            !artifact.uri &&
            !(artifact.extract || artifact.executable || artifact.cache)
          )
      );
    }

    try {
      jobSpecCopy.job.labels = (jobSpec.job.labels || []).reduce<
        Record<string, string>
      >((acc, [k, v]) => ({ ...acc, [k]: v }), {});
    } catch {}
  }

  const jobOutput = {
    job: jobSpecCopy.job,
    schedule: jobSpecCopy.schedule
  };

  return jobOutput;
}

export const jobSpecToFormOutputParser = (jobSpec: JobSpec): FormOutput => {
  const container = jobSpec.container;
  const run = jobSpec.job.run;

  const containerImage =
    container === Container.UCR
      ? findNestedPropertyInObject(jobSpec, "job.run.ucr.image.id")
      : findNestedPropertyInObject(jobSpec, "job.run.docker.image");
  const dockerParameters =
    run.docker &&
    Array.isArray(run.docker.parameters) &&
    run.docker.parameters.length > 0
      ? run.docker.parameters
      : [];
  const args = Array.isArray(run.args) && run.args.length > 0 ? run.args : [];
  const imageForcePull =
    container === Container.UCR
      ? findNestedPropertyInObject(jobSpec, "job.run.ucr.image.forcePull")
      : findNestedPropertyInObject(jobSpec, "job.run.docker.forcePullImage");
  const grantRuntimePrivileges =
    container === Container.Docker &&
    findNestedPropertyInObject(jobSpec, "job.run.docker.privileged");

  return {
    jobId: jobSpec.job.id,
    description: jobSpec.job.description,
    cmdOnly: jobSpec.cmdOnly,
    container,
    cmd: run.cmd,
    containerImage,
    imageForcePull,
    grantRuntimePrivileges,
    cpus: run.cpus,
    gpus: run.gpus,
    mem: run.mem,
    disk: run.disk,
    dockerParams: dockerParameters,
    maxLaunchDelay: run.maxLaunchDelay,
    killGracePeriod: run.taskKillGracePeriodSeconds,
    user: run.user,
    restartPolicy: findNestedPropertyInObject(
      jobSpec,
      "job.run.restart.policy"
    ),
    retryTime: findNestedPropertyInObject(
      jobSpec,
      "job.run.restart.activeDeadlineSeconds"
    ),
    labels: jobSpec.job.labels,
    artifacts: run.artifacts,
    args
  };
};
