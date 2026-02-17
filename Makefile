docker-build: 
	docker build -t itamba-app .

lint:fix
	npm run lint
	
fix:
	npx prettier --write .
	
install-tools: 
	sudo apt update
	sudo apt install npm
	npm install --legacy-peer-deps

build-local: 
	yarn build

analyze:
	npm run analyze
	
run:
	npm i
	npm run dev

run-docker:docker-build 
	docker run -it --env-file .env.local -p 3000:3000 -e PORT=3000  itamba-app

test:
	# copy over the example .env to allow the build to complete
	if [ ! -f '.env.local' ]; then \
		cp .env.example .env.local; \
	fi
	CI=true yarn test

coverage: 
	yarn coverage

audit:
	npm audit --audit-level=critical

BRANCH ?= main
get-client:
	rm -rf @hey_api tempz
	mkdir -p tempz @hey_api
	git clone -b $(BRANCH)  git@github.com:Iknite-Space/itamba-api.git ./tempz
	cp -r ./tempz/client/. ./@hey_api
	npm install @hey-api/client-axios@0.3.1 @hey-api/client-fetch@0.5.4 axios@1.7.9
	rm -rf tempz


.PHONY: docker-build lint fix install-tools build-local run run-docker test coverage get-client analyze


