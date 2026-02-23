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

e2e:
	npm run e2e

e2e-run:
	npm run e2e:run

e2e-auth:
	npx cypress run --spec "cypress/e2e/auth-only.cy.ts"

e2e-browse:
	npx cypress run --spec "cypress/e2e/browse-library.cy.ts"

e2e-subscription:
	npx cypress run --spec "cypress/e2e/subscription-only.cy.ts"

e2e-mobile:
	CYPRESS_VIEWPORT_WIDTH=375 CYPRESS_VIEWPORT_HEIGHT=667 npx cypress run --spec "cypress/e2e/browse-library-mobile.cy.ts"

e2e-happy-path:
	npx cypress run --spec "cypress/e2e/happy-path.cy.ts"


.PHONY: docker-build lint fix install-tools build-local run run-docker test coverage get-client analyze e2e e2e-run e2e-auth e2e-browse e2e-subscription e2e-mobile e2e-happy-path


