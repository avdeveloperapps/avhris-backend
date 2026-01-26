# avhris-backend
mkdir -p backups
mongodump --uri "mongodb://avhris-database.internal:27017/hris?retryWrites=true&w=majority" --gzip --archive=backups/hris-$(date +%Y%m%d-%H%M%S).gz
fly deploy -c fly.db.toml

mongodump --uri "mongodb://127.0.0.1:27017/local?retryWrites=true&w=majority" --gzip --archive=backups/local-$(date +%Y%m%d-%H%M%S).gz

# Stop & destroy mesin yang tidak diinginkan
fly m stop 784e4d3fe54068 -a avhris-database
fly m destroy 784e4d3fe54068 -a avhris-database

# Hapus volume yang ikut tercipta
fly volumes delete vol_vx2d3zn0e6112ojr -a avhris-database --yes

fly m list -a avhris-database
fly volumes list -a avhris-database


fly m update e82de15a240128 \
  -a avhris-database \
  --entrypoint mongod \
  --command "--ipv6 --bind_ip_all"

fly ssh console -a avhris-database --command "mongosh --quiet --eval 'db.adminCommand({ ping: 1 })'"
fly ssh console -a avhris-database --command "nc -vz avhris-database.internal 27017"



