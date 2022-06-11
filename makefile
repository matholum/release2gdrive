BUILD_DIR = ./build
DIST_DIR = ./dist
PUSH_BRANCH = develop

define NEWLINE

endef

ifdef commit-branch
PUSH_BRANCH = $(commit-branch)
endif

.PHONY: build
build:
	echo $(NEWLINE)$(NEWLINE)🛠 Building project...

	corepack enable
	yarn install --immutable
	yarn build
	yarn test

.PHONY: format
format:
	echo $(NEWLINE)🧼️ Formatting and linting files...

	corepack enable
	yarn install --immutable

ifeq ($(commit), true)
ifneq ($(commit-branch),)
	yarn lint --commit --commit-branch=$(commit-branch)
else
	yarn lint --commit
endif
else
	yarn lint
endif

.PHONY: artifacts
artifacts:
	echo $(NEWLINE)🏺 Creating build artifacts...
	
	$(eval package_name = $(shell npm pkg get name))
	$(eval current_version = $(shell npm pkg get version))

	yarn install --immutable
	yarn build --outDir ./build
	yarn test
	yarn copy-package-json
	cp README.md LICENSE $(BUILD_DIR)

	echo 📦 Zipping $(BUILD_DIR)...
	mkdir -p $(DIST_DIR)
	zip -q -r "$(DIST_DIR)/$(package_name)_$(current_version).zip" $(BUILD_DIR);

ifneq (,$(wildcard RELEASE_VERSION))
	rm RELEASE_VERSION
endif

	echo $(current_version) >> RELEASE_VERSION

.PHONY: version
version:
	echo $(NEWLINE)🏷 Tagging and updating version...

	yarn install --immutable;

	$(eval current_version = $(shell npm pkg get version))
	# $(eval new_version = $(shell npx -q semver -i patch $(current_version)))
	$(eval new_version = $(shell npx -q semver -i prerelease --preid=alpha $(current_version)))

ifeq ($(tag), true)
	git tag v$(current_version);
	git push origin v$(current_version)
endif
ifdef commit-branch
	git checkout $(commit-branch)
endif

	npm version $(new_version) --commit-hooks=false --git-tag-version=false;

ifeq ($(commit), true)
	git add package.json
	git commit -m 'chore(repo): bumping version to $(new_version)';
	git push -u origin $(PUSH_BRANCH)
endif
