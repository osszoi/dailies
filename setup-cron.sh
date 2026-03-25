#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/processor.log"

# source /etc/environment explicitly so OPENAI_API_KEY is available (PAM sets it there, not bash -l)
CRON_JOB="0 * * * * /bin/bash -c 'set -a; . /etc/environment; set +a; cd $SCRIPT_DIR && go run processor.go >> $LOG_FILE 2>&1'"

if crontab -l 2>/dev/null | grep -qF "processor.go"; then
  echo "Cron job already exists, nothing to do."
  crontab -l | grep "processor.go"
  exit 0
fi

(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "Cron job added — runs every hour."
echo "Logs: $LOG_FILE"
