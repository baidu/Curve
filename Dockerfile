FROM python:2.7

RUN apt-get update

RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get install -y nodejs
RUN apt-get install -y npm
RUN apt-get install -y git
RUN apt-get install -y vim

RUN python -m pip install virtualenv

WORKDIR /root
