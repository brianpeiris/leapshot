nodemon -w src/server/index.js src/server/index.js &
browser-sync start -s -w -f src/client/ --no-open --no-notify --no-ghost-ui --directory --ss ~/Pictures/Screenshots/ &
node_modules/.bin/webpack --entry=$PWD/src/client/app.js --output dist/app.js --mode development --watch &
node_modules/.bin/webpack --entry=$PWD/src/client/cursor.js --output dist/cursor.js --mode development --watch &
trap 'trap - SIGTERM && kill 0' SIGINT SIGTERM EXIT
read
