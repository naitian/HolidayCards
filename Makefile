SCSS_SOURCE = $(wildcard template/styles/*.scss)
SCSS_TARGET = $(patsubst template/styles/%.scss,dist/styles/%.css,$(SCSS_SOURCE))
JS_SOURCE = $(wildcard template/js/*.js)
JS_TARGET = $(patsubst template/js/%.js,dist/js/%.js,$(JS_SOURCE))


dist/styles/:
	mkdir -p dist/styles

dist/js/:
	mkdir -p dist/js

$(SCSS_TARGET) : dist/styles/%.css : template/styles/%.scss $(wildcard template/styles/partials/_*.scss) | dist/styles/
	@echo $?
	@echo $@
	./node_modules/.bin/sass -I template/styles/partials $< $@

$(JS_TARGET) : dist/js/%.js : template/js/%.js | dist/js/
	@echo $?
	@echo $@
	./node_modules/.bin/uglifyjs $< $@

css: $(SCSS_TARGET)

js: $(JS_TARGET)

clean:
	rm -rf dist/*

run: clean css render.py dist/js/
	mypy --ignore-missing-imports render.py
	python render.py
	cp template/favicons/* dist/
	cp -r template/js/* dist/js/
	cp template/robots.txt dist/robots.txt

prod: run
	aws s3 sync ./dist/ s3://naitian.holiday/

test-mail: prod
	echo "Sending test email"

.PHONY: run prod css js
