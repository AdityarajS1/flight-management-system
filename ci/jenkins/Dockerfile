FROM docker:29.8.2-cli AS docker-cli

FROM node:20-bookworm-slim AS node-runtime

FROM jenkins/jenkins:lts-jdk21

USER root

RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates curl git jq \
    && rm -rf /var/lib/apt/lists/*

COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
COPY --from=node-runtime /usr/local/lib/node_modules /usr/local/lib/node_modules

RUN ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -sf /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
    && curl --http1.1 --fail --silent --show-error --location \
      --retry 5 --retry-all-errors --retry-delay 2 \
      https://dl.k8s.io/release/v1.36.1/bin/linux/amd64/kubectl \
      --output /usr/local/bin/kubectl \
    && chmod 0755 /usr/local/bin/kubectl

COPY ci/jenkins/plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

ENV JAVA_OPTS="-Xms256m -Xmx768m -Djava.awt.headless=true"

USER root
