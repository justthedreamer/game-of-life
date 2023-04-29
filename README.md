# Game Of Life

![](gol-preview.gif)

## Prerequisites

+ go
+ npx (optional)
+ tailwindcss (optional)
+ tsc (optional)
+ make (optional)

## BUILD

> TS, tailwindcss and WASM are precompiled.

To build everything run:

```shell
make build
```

To build server run:

```shell
make build-server
```

or

```shell
go build server.go
```

## RUNNING THE PROGRAM

To start the server run:

```shell
./server
```

then go to `localhost:3000`.

Alternatively you can start the server with make:

```shell
make run
```

which will build and run the server.

### TODO

+ pan and zoom on canvas
+ better game of life algorithm (NOTE: already written; investigate the memory leak in wasm)