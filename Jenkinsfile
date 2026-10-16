pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        timestamps()
        timeout(time: 45, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    parameters {
        string(
            name: 'IMAGE_REPOSITORY',
            defaultValue: 'ghcr.io/adityarajs1/flight-management-system',
            description: 'Lowercase GHCR repository to publish from main'
        )
        string(
            name: 'K8S_NAMESPACE',
            defaultValue: 'flight-management',
            description: 'Kubernetes namespace for deployment'
        )
        booleanParam(
            name: 'DEMONSTRATE_TEST_FAILURE',
            defaultValue: false,
            description: 'Enable a deliberately failing Jest test to verify deployment is blocked'
        )
    }

    environment {
        TEST_DB_NAME = 'flight_management'
        TEST_DB_USER = 'root'
        TEST_DB_PASSWORD = 'ci-root-password'
        TEST_ADMIN_EMAIL = 'ci-admin@example.test'
        TEST_ADMIN_PASSWORD = 'ci-only-admin-password'
        TEST_JWT_SECRET = 'ci-only-jwt-signing-key-not-for-production-2026'
        CI_DOCKER_NETWORK = 'flight-management-ci'
        DEPLOY_TOOL_IMAGE = 'flight-management-jenkins:local'
        BACKEND_TEST_DB = "flight-ci-db-${BUILD_NUMBER}"
        E2E_TEST_DB = "flight-e2e-db-${BUILD_NUMBER}"
        E2E_MAIL = "flight-e2e-mail-${BUILD_NUMBER}"
        E2E_SELENIUM = "flight-e2e-selenium-${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                dir('backend') {
                    sh 'sh ./mvnw -B -DskipTests package'
                }
            }
        }

        stage('Backend tests') {
            steps {
                sh '''
                    docker run --detach --name "$BACKEND_TEST_DB" \
                      --network "$CI_DOCKER_NETWORK" \
                      -e MYSQL_ROOT_PASSWORD="$TEST_DB_PASSWORD" \
                      -e MYSQL_DATABASE="$TEST_DB_NAME" \
                      mysql:8.4
                    for attempt in $(seq 1 60); do
                      if docker exec "$BACKEND_TEST_DB" mysqladmin ping \
                        --host=127.0.0.1 --user="$TEST_DB_USER" \
                        --password="$TEST_DB_PASSWORD" --silent; then
                        break
                      fi
                      if [ "$attempt" -eq 60 ]; then
                        echo "MySQL did not become ready for backend tests."
                        exit 1
                      fi
                      sleep 2
                    done
                '''
                dir('backend') {
                    withEnv([
                        "DB_URL=jdbc:mysql://${env.BACKEND_TEST_DB}:3306/${env.TEST_DB_NAME}",
                        "DB_USERNAME=${env.TEST_DB_USER}",
                        "DB_PASSWORD=${env.TEST_DB_PASSWORD}",
                        "ADMIN_EMAIL=${env.TEST_ADMIN_EMAIL}",
                        "ADMIN_PASSWORD=${env.TEST_ADMIN_PASSWORD}",
                        "ADMIN_NAME=CI Admin",
                        "JWT_SECRET=${env.TEST_JWT_SECRET}"
                    ]) {
                        sh 'sh ./mvnw -B test'
                    }
                }
            }
            post {
                always {
                    sh 'docker rm --force "$BACKEND_TEST_DB" >/dev/null 2>&1 || true'
                }
            }
        }

        stage('Frontend tests') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    withEnv(["DEMONSTRATE_TEST_FAILURE=${params.DEMONSTRATE_TEST_FAILURE}"]) {
                        sh 'CI=true npm test -- --watchAll=false --runInBand'
                    }
                }
            }
        }

        stage('Selenium tests') {
            steps {
                sh '''
                    docker run --detach --name "$E2E_TEST_DB" \
                      --network "$CI_DOCKER_NETWORK" \
                      -e MYSQL_ROOT_PASSWORD="$TEST_DB_PASSWORD" \
                      -e MYSQL_DATABASE="$TEST_DB_NAME" \
                      mysql:8.4
                    docker run --detach --name "$E2E_MAIL" \
                      --network "$CI_DOCKER_NETWORK" \
                      mailhog/mailhog:v1.0.1
                    docker run --detach --name "$E2E_SELENIUM" --shm-size=2g \
                      --network "$CI_DOCKER_NETWORK" \
                      selenium/standalone-chrome:4.27.0

                    for attempt in $(seq 1 60); do
                      if docker exec "$E2E_TEST_DB" mysqladmin ping \
                        --host=127.0.0.1 --user="$TEST_DB_USER" \
                        --password="$TEST_DB_PASSWORD" --silent; then
                        break
                      fi
                      if [ "$attempt" -eq 60 ]; then
                        echo "MySQL did not become ready for Selenium tests."
                        exit 1
                      fi
                      sleep 2
                    done
                    for attempt in $(seq 1 60); do
                      if curl --fail --silent "http://$E2E_SELENIUM:4444/status" >/dev/null; then
                        break
                      fi
                      if [ "$attempt" -eq 60 ]; then
                        echo "Selenium Chrome did not become ready."
                        exit 1
                      fi
                      sleep 2
                    done

                    nohup env \
                      DB_URL="jdbc:mysql://$E2E_TEST_DB:3306/$TEST_DB_NAME" \
                      DB_USERNAME="$TEST_DB_USER" \
                      DB_PASSWORD="$TEST_DB_PASSWORD" \
                      ADMIN_EMAIL="$TEST_ADMIN_EMAIL" \
                      ADMIN_PASSWORD="$TEST_ADMIN_PASSWORD" \
                      ADMIN_NAME="CI Admin" \
                      JWT_SECRET="$TEST_JWT_SECRET" \
                      SPRING_MAIL_HOST="$E2E_MAIL" \
                      SPRING_MAIL_PORT=1025 \
                      SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=false \
                      SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=false \
                      java -jar backend/target/backend-0.0.1-SNAPSHOT.jar \
                      > .jenkins-app.log 2>&1 &
                    echo $! > .jenkins-app.pid

                    for attempt in $(seq 1 90); do
                      if curl --fail --silent http://127.0.0.1:8085/ >/dev/null; then
                        exit 0
                      fi
                      if ! kill -0 "$(cat .jenkins-app.pid)" 2>/dev/null; then
                        cat .jenkins-app.log
                        echo "Application exited before becoming ready."
                        exit 1
                      fi
                      sleep 2
                    done
                    cat .jenkins-app.log
                    echo "Application did not become ready for Selenium tests."
                    exit 1
                '''
                dir('frontend') {
                    withEnv([
                        'APP_BASE_URL=http://jenkins:8085',
                        'API_BASE_URL=http://jenkins:8085',
                        "SELENIUM_REMOTE_URL=http://${env.E2E_SELENIUM}:4444/wd/hub"
                    ]) {
                        sh 'npm run test:e2e'
                    }
                }
            }
            post {
                always {
                    sh '''
                        if [ -f .jenkins-app.pid ]; then
                          app_pid=$(cat .jenkins-app.pid)
                          if kill -0 "$app_pid" 2>/dev/null; then
                            kill "$app_pid"
                          fi
                          rm -f .jenkins-app.pid
                        fi
                        rm -f .jenkins-app.log .jenkins-namespace.yaml .jenkins-deployment.yaml
                        docker rm --force "$E2E_SELENIUM" "$E2E_MAIL" "$E2E_TEST_DB" \
                          >/dev/null 2>&1 || true
                    '''
                }
            }
        }

        stage('Docker image build') {
            steps {
                sh 'docker build --tag "flight-management:${BUILD_NUMBER}" .'
            }
        }

        stage('Kubernetes deployment') {
            when {
                branch 'main'
            }
            steps {
                script {
                    def imageRepository = params.IMAGE_REPOSITORY?.trim()
                    if (!imageRepository ||
                        imageRepository.contains('/your-org/') ||
                        !(imageRepository ==~ /ghcr\.io\/[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9._-]*/)) {
                        error('IMAGE_REPOSITORY must be a valid ghcr.io/owner/image repository.')
                    }
                    def sourceCommit = sh(
                        returnStdout: true,
                        script: 'git rev-parse --verify HEAD'
                    ).trim()
                    if (!(sourceCommit ==~ /[0-9a-fA-F]{40}/)) {
                        error('Could not determine the checked-out Git commit for the image tag.')
                    }
                    env.PUBLISHED_IMAGE =
                        "${imageRepository}:${sourceCommit.take(12)}"
                }
                withCredentials([
                    usernamePassword(
                        credentialsId: 'flight-registry',
                        usernameVariable: 'REGISTRY_USER',
                        passwordVariable: 'REGISTRY_PASSWORD'
                    ),
                    file(
                        credentialsId: 'flight-kubeconfig',
                        variable: 'KUBECONFIG'
                    )
                ]) {
                    sh '''
                        printf '%s' "$REGISTRY_PASSWORD" | docker login ghcr.io \
                          --username "$REGISTRY_USER" --password-stdin
                        docker tag "flight-management:${BUILD_NUMBER}" "$PUBLISHED_IMAGE"
                        docker push "$PUBLISHED_IMAGE"
                        docker logout ghcr.io

                        deploy_helper="flight-deploy-${BUILD_NUMBER}"
                        trap 'docker rm --force "$deploy_helper" >/dev/null 2>&1 || true' EXIT
                        docker create --name "$deploy_helper" --network host \
                          "$DEPLOY_TOOL_IMAGE" sleep infinity >/dev/null
                        docker start "$deploy_helper" >/dev/null
                        docker exec "$deploy_helper" mkdir -p /workspace/k8s
                        docker cp k8s/. "$deploy_helper:/workspace/k8s/"
                        docker cp "$KUBECONFIG" "$deploy_helper:/tmp/kubeconfig"
                        docker exec --env K8S_NAMESPACE="$K8S_NAMESPACE" \
                          --env PUBLISHED_IMAGE="$PUBLISHED_IMAGE" \
                          "$deploy_helper" sh -eu -c '
                            export KUBECONFIG=/tmp/kubeconfig
                            chmod 600 "$KUBECONFIG"
                            kubectl create namespace "$K8S_NAMESPACE" \
                              --dry-run=client --output=yaml | kubectl apply --filename=-
                            kubectl apply --namespace "$K8S_NAMESPACE" \
                              --filename=/workspace/k8s/configmap.yaml
                            kubectl apply --namespace "$K8S_NAMESPACE" \
                              --filename=/workspace/k8s/mailhog.yaml
                            kubectl rollout status deployment/mailhog \
                              --namespace "$K8S_NAMESPACE" --timeout=180s
                            kubectl apply --namespace "$K8S_NAMESPACE" \
                              --filename=/workspace/k8s/database.yaml
                            kubectl rollout status statefulset/flight-management-db \
                              --namespace "$K8S_NAMESPACE" --timeout=300s
                            sed "s|__IMAGE__|$PUBLISHED_IMAGE|g" \
                              /workspace/k8s/deployment.yaml \
                              > /tmp/flight-management-deployment.yaml
                            kubectl apply --namespace "$K8S_NAMESPACE" \
                              --filename=/tmp/flight-management-deployment.yaml
                            kubectl apply --namespace "$K8S_NAMESPACE" \
                              --filename=/workspace/k8s/service.yaml
                            kubectl rollout status deployment/flight-management \
                              --namespace "$K8S_NAMESPACE" --timeout=180s
                            kubectl apply --namespace "$K8S_NAMESPACE" \
                              --kustomize=/workspace/k8s/monitoring
                            kubectl rollout status deployment/prometheus \
                              --namespace "$K8S_NAMESPACE" --timeout=180s
                            kubectl rollout status deployment/grafana \
                              --namespace "$K8S_NAMESPACE" --timeout=180s
                          '
                    '''
                }
            }
        }
    }

    post {
        always {
            sh '''
                docker rm --force "$BACKEND_TEST_DB" >/dev/null 2>&1 || true
                docker rm --force "$E2E_SELENIUM" "$E2E_MAIL" "$E2E_TEST_DB" \
                  >/dev/null 2>&1 || true
                docker image rm "flight-management:${BUILD_NUMBER}" >/dev/null 2>&1 || true
            '''
            archiveArtifacts(
                artifacts: 'backend/target/surefire-reports/**,frontend/e2e-failure.png',
                allowEmptyArchive: true
            )
        }
    }
}
