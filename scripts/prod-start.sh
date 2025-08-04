ENV_FILE="env/.env.production"
DOCKER_COMPOSE_BASEPATH="Docker-compose"
DOCKER_COMPOSE_BASEFILE="docker-compose.yml"


# Check if the .env.production file exists in the current directory
if [ -f "${ENV_FILE}" ]; then
  echo ".env.production found. Starting with variables from this file."
  docker compose --env-file "${ENV_FILE}" -f ${DOCKER_COMPOSE_BASEPATH}/${DOCKER_COMPOSE_BASEFILE} -f ${DOCKER_COMPOSE_BASEPATH}/docker-compose.production.yml up -d
else
  echo "No .env.production found. Starting with shell environment variables."
  docker compose -f "${ENV_FILE}" -f ${DOCKER_COMPOSE_BASEPATH}/${DOCKER_COMPOSE_BASEFILE} -f ${DOCKER_COMPOSE_BASEPATH}/docker-compose.production.yml up -d
fi
