build:
	GOOS=js GOARCH=wasm go build -o web/static/wasm/main.wasm ./main.go
	tsc -p ./web/static/js
	npx tailwindcss -i ./web/static/css/input.css -o ./web/static/css/output.css --minify

build-server:
	go build server.go

run: build-server
	./server

all: build run