BUILD_DIR = ./build
DIST_DIR = ./dist
PUSH_BRANCH = develop

define NEWLINE

endef

ifeq ($(commit-branch),)
PUSH_BRANCH = $(commit-branch)
endif

.PHONY: build
build:
	echo $(NEWLINE)$(NEWLINE)🛠 Building project...

	corepack enable
	yarn install --immutable
	yarn build

.PHONY: format
format:
	echo $(NEWLINE)🧼️ Formatting and linting files...

	yarn install --immutable
	yarn dlx prettier --write --list-different "src/**/*.ts"
	yarn dlx eslint --fix

ifeq ($(commit), true)
	$(eval changes = $(shell git status -s))
	$(if $(strip $(changes)), git add .; git commit -m 'cleanup(misc): formatting and lint changes'; git push -u origin $(PUSH_BRANCH))
endif

.PHONY: artifacts
artifacts:
	echo $(NEWLINE)🏺 Creating build artifacts...
	
	$(eval package_name = $(shell npm pkg get name))
	$(eval current_version = $(shell npm pkg get version))

	yarn install --immutable
	yarn build --outDir ./build
	yarn copy-package-json
	cp README.md LICENSE $(BUILD_DIR)

	echo 📦 Zipping $(BUILD_DIR)...
	mkdir -p $(DIST_DIR)
	zip -q -r "$(DIST_DIR)/$(package_name)_$(current_version).zip" $(BUILD_DIR);
