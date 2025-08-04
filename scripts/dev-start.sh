ENV_FILE="env/.env.development"
DOCKER_COMPOSE_BASEPATH="Docker-compose"
DOCKER_COMPOSE_BASEFILE="docker-compose.yml"


# Check if the .env.development file exists in the current directory
if [ -f "${ENV_FILE}" ]; then
  echo ".env.development found. Starting with variables from this file."
  docker compose --env-file "${ENV_FILE}" -f ${DOCKER_COMPOSE_BASEPATH}/${DOCKER_COMPOSE_BASEFILE} -f ${DOCKER_COMPOSE_BASEPATH}/docker-compose.development.yml up
else
  echo "No .env.development found. Starting with shell environment variables."
  docker compose -f "${DOCKER_COMPOSE_BASEPATH}/${DOCKER_COMPOSE_BASEFILE}" -f "${DOCKER_COMPOSE_BASEPATH}/docker-compose.development.yml" up --watch
fi
