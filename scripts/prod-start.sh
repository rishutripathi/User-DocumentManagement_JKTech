# Check if the .env.production file exists in the current directory
if [ -f .env.production ]; then
  echo "Found .env.production file. Starting with variables from this file."
  docker compose --env-file .env.production up
else
  echo "No .env.production file found. Starting with shell environment variables."
  docker compose up
fi
