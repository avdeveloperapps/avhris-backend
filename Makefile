deploy:
	fly deploy --no-cache

proxy:
	flyctl proxy 27017:27017 -a avhris-database
