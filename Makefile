APP_NAME ?= $(shell sed -n "s/^app = ['\"]\\(.*\\)['\"]/\\1/p" fly.toml | head -n 1)

proxy:
	flyctl proxy 27017:27017 -a avhris-database

logs:
	flyctl logs -a $(APP_NAME)

logs-slow:
	flyctl logs -a $(APP_NAME) --no-tail --json | python3 scripts/filter_fly_logs.py --hours 12 --contains slow_request

fly-logs-slow-12h:
	flyctl logs -a $(APP_NAME) --no-tail --json | python3 scripts/filter_fly_logs.py --hours 12 --contains slow_request
