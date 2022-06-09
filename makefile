define NEWLINE

endef

.PHONY: build
build:
	echo $(NEWLINE)$(NEWLINE)🛠 Building project...

	yarn install --immutable
	yarn build
