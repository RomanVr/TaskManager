start:
		npm run nodemon -- --exec babel-node src/bin/server.js

debugApp:
	DEBUG=app npm run nodemon -- --exec babel-node src/bin/server.js

debugRoutes:
	DEBUG=routes npm run nodemon -- --exec babel-node src/bin/server.js

debugAll:
	DEBUG=routes,app npm run nodemon -- --exec babel-node src/bin/server.js


install:
		npm install

lint:
		npx eslint .

test:
		DEBUG=routes,app npm run test

testc:
		DEBUG=routes,app npm test -- --coverage

test-coverage:
		npm test -- --coverage

build:
		rm -rf dist
		npx babel src --out-dir dist

publish:
		npm publish

.PHONY: test
