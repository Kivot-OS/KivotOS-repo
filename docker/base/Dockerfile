FROM debian:trixie-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8

RUN apt-get update -q && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# KivotOS APT repo
COPY docker/base/apt-key.asc /etc/apt/trusted.gpg.d/kivotos.asc
RUN echo "deb https://apt.kvtos.qzz.io/ trixie main" > /etc/apt/sources.list.d/kivotos.list

RUN apt-get update -q && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
