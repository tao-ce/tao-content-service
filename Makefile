# SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
#
# SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

ES_BASE_URL = http://es.tao-content.docker.localhost
QUICKTYPE=node_modules/.bin/quicktype

up:
		docker compose up

shell:
		docker container exec -it tao_content_service_app_node /bin/sh || true

recreate-index:
		@echo -e "\n\033[1m * Deleting previous index, if any\033[0m\n"
		curl -X DELETE ${ES_BASE_URL}/asset
		@echo -e "\n\n\033[1m * Creating new index\033[0m\n"
		curl -X PUT -H "Content-Type: application/json" -d @mappings/asset.json ${ES_BASE_URL}/asset
		@echo -e "\n"

model-entities:
		@stat model/asset.schema.json >/dev/null # Fail early if we are not in the correct dir
		@mkdir -p model
		@${QUICKTYPE} --lang javascript --src-lang schema --out model/asset.model.js --top-level Asset model/asset.schema.json
		@${QUICKTYPE} --lang typescript --src-lang schema --out model/asset.interface.ts --just-types --top-level Asset model/asset.schema.json

authenticate:
		docker container exec -it tao_content_service_app_node gcloud auth application-default login
