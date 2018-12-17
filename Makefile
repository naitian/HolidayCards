SCSS_SOURCE = $(wildcard template/styles/*.scss)
SCSS_TARGET = $(patsubst template/styles/%.scss,dist/styles/%.css,$(SCSS_SOURCE))


dist/styles:
	mkdir -p dist/styles

dist/js:
	mkdir -p dist/js

$(SCSS_TARGET) : dist/styles/%.css : template/styles/%.scss $(wildcard template/styles/partials/_*.scss) | dist/styles/
	@echo $?
	@echo $@
	./node_modules/.bin/sass -I template/styles/partials $< $@

css: $(SCSS_TARGET)

run: css render.py
	mypy --ignore-missing-imports render.py
	python render.py
	cp template/favicons/* dist/
	cp -r template/js dist/js

prod: run


.PHONY: run prod css
