start:
		npx babel-node -- src/bin/server.js

install:
		npm install

lint:
		npx eslint .

test:
		npm run test

test-coverage:
		npm test -- --coverage

testc:
		sudo DEBUG=page-loader npm test -- --coverage

build:
		rm -rf dist
		npx babel src --out-dir dist

publish:
		npm publish

.PHONY: test
