#!/usr/bin/env groovy

@Library("sec_ci_libs@v2-latest") _

def master_branches = ["master", ] as String[]

pipeline {
  agent {
    dockerfile {
      args  "--shm-size=1g"
    }
  }

  environment {
    JENKINS_VERSION = "yes"
    NODE_PATH = "node_modules"
    INSTALLER_URL= "https://downloads.dcos.io/dcos/testing/master/dcos_generate_config.sh"
  }

  options {
    timeout(time: 4, unit: "HOURS")
    disableConcurrentBuilds()
  }

  stages {
    stage("Authorization") {
      steps {
        user_is_authorized(master_branches, "8b793652-f26a-422f-a9ba-0d1e47eb9d89", "#frontend-dev")
      }
    }

    stage("Build") {
      steps {
        withCredentials([
          usernamePassword(credentialsId: "a7ac7f84-64ea-4483-8e66-bb204484e58f", passwordVariable: "GIT_PASSWORD", usernameVariable: "GIT_USER")
        ]) {
          // Clone the repository again with a full git clone
          sh "rm -rf {.*,*} || ls -la && git clone https://\$GIT_USER:\$GIT_PASSWORD@github.com/dcos/dcos-ui.git ."
        }
        sh "git fetch"
        sh "git checkout \"\$([ -z \"\$CHANGE_BRANCH\" ] && echo \$BRANCH_NAME || echo \$CHANGE_BRANCH )\""

        // jenkins seem to have this variable set for no reason, explicitly remiving it…
        sh "npm config delete externalplugins"
        sh "npm --unsafe-perm ci"
        sh "npm run validate-tests"
        sh "npm run build"
      }
    }


    stage("Lint Commits") {
      when {
        expression {
          !master_branches.contains(BRANCH_NAME)
        }
      }

      steps {
        sh 'npm run commitlint -- --from "${CHANGE_TARGET}"'
      }
    }

    stage("Tests") {
      parallel {
        stage("Integration Test") {
          environment {
            REPORT_TO_DATADOG = master_branches.contains(BRANCH_NAME)
          }
          steps {
            withCredentials([
              string(credentialsId: '66c40969-a46d-470e-b8a2-6f04f2b3f2d5', variable: 'DATADOG_API_KEY'),
              //string(credentialsId: 'MpukWtJqTC3OUQ1aClsA', variable: 'DATADOG_APP_KEY'),
            ]) {
              sh "./scripts/ci/createDatadogConfig.sh"
           }
            sh "npm run integration-tests"
          }

          }
        }

       stage("System Test") {
          steps {
            withCredentials([
              [
                $class: "AmazonWebServicesCredentialsBinding",
                credentialsId: "f40eebe0-f9aa-4336-b460-b2c4d7876fde",
                accessKeyVariable: "AWS_ACCESS_KEY_ID",
                secretKeyVariable: "AWS_SECRET_ACCESS_KEY"
              ]
            ]) {
              retry(3) {
                //sh "dcos-system-test-driver -j1 -v ./system-tests/driver-config/jenkins.sh"
                sh "dummy op"
                sh "cat ./system-tests/driver-config/jenkins.sh"
                sh "which dcos-system-test-driver"
              }
            }
          }

        } 
      }
  }

