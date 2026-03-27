build:
	GID=$(id -g) UID=$(id -u) docker compose down && docker compose up --build -d
