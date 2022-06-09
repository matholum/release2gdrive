PUSH_BRANCH = develop

define NEWLINE

endef

ifeq ($(commit-branch),)
PUSH_BRANCH = $(commit-branch)
endif

.PHONY: build
build:
	echo $(NEWLINE)$(NEWLINE)🛠 Building project...

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
