up:
	docker compose up -d

down:
	docker compose down

api:
	cd api-gateway && yarn dev

auth:
	cd services/auth && yarn dev

email:
	cd services/email && yarn dev

inventory:
	cd services/inventory && yarn dev

product:
	cd services/product && yarn dev

user:
	cd services/user && yarn dev

