// TODO: FUNCTION NAME REFACTOR
// TODO :CLEANUP
package main

import (
	"fmt"
	"log"
	"math/rand"
	"regexp"
	"strconv"
	"strings"
	"syscall/js"
)

var (
	currentRule = convertRuleStringToRules("B3/S23")
	board       InfiniteBoard
)

type Cell interface {
	isAlive() bool
	state(n int) Cell
}

type DeadCell struct {
}

type LiveCell struct {
}

func (dc DeadCell) isAlive() bool {
	return false
}

func (dc DeadCell) state(n int) Cell {
	if contains(currentRule.b, n) {
		return LiveCell{}
	} else {
		return DeadCell{}
	}
}

func (lc LiveCell) isAlive() bool {
	return true
}

func (lc LiveCell) state(n int) Cell {
	if contains(currentRule.s, n) {
		return LiveCell{}
	} else {
		return DeadCell{}
	}
}

type InfiniteBoard struct {
	generation int
	x, y       int
	cells      []Cell
}

func initializeBoard(x, y int) InfiniteBoard {
	cells := make([]Cell, y*x)
	for i := 0; i < y*x; i++ {
		cells[i] = DeadCell{}
	}
	return InfiniteBoard{generation: 0, x: x, y: y, cells: cells}
}

func nextGeneration() {
	newCells := make([]Cell, board.x*board.y)
	for i := 0; i < board.x*board.y; i++ {
		newCells[i] = board.cells[i]
	}

	for y := 0; y < board.y; y++ {
		for x := 0; x < board.x; x++ {
			neighboursCount := calculateNeighboursCount(x, y)
			state := board.cells[y*board.y+x].state(neighboursCount)
			newCells[y*board.y+x] = state
		}
	}
	board.cells = newCells
}

func calculateNeighboursCount(x, y int) int {
	neighbours := 0

	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			columnIndex := x + i - 1
			rowIndex := y + j - 1

			if i == 1 && j == 1 {
				continue
			}
			if columnIndex < 0 {
				columnIndex += board.x
			} else if columnIndex > board.x-1 {
				columnIndex -= board.x
			}

			if rowIndex < 0 {
				rowIndex += board.y
			} else if rowIndex > board.y-1 {
				rowIndex -= board.y
			}

			if board.cells[rowIndex*board.y+columnIndex].isAlive() {
				neighbours++
			}

		}
	}
	return neighbours
}

func main() {
	js.Global().Set("InitBoard", js.FuncOf(initBoard))
	js.Global().Set("GetNextGeneration", js.FuncOf(getNextGeneration))
	js.Global().Set("InitRules", js.FuncOf(initRules))
	js.Global().Set("GetCurrentGeneration", js.FuncOf(getCurrentGeneration))
	js.Global().Set("ChangeCellState", js.FuncOf(changeCellState))
	js.Global().Set("RandomizeBoard", js.FuncOf(randomizeBoard))
	js.Global().Set("UpdateRules", js.FuncOf(applyCustomRules))
	js.Global().Set("ClearBoard", js.FuncOf(clearBoard))
	js.Global().Set("ApplyCustomRules", js.FuncOf(applyCustomRules))
	js.Global().Set("SetRule", js.FuncOf(setRule))
	<-make(chan bool)
}

func initBoard(this js.Value, args []js.Value) interface{} {
	board = initializeBoard(args[0].Int(), args[1].Int())
	return true
}

func getNextGeneration(this js.Value, args []js.Value) interface{} {
	nextGeneration()
	return convertBoard(board.cells)
}

func getCurrentGeneration(this js.Value, args []js.Value) interface{} {
	return convertBoard(board.cells)
}

func changeCellState(this js.Value, args []js.Value) interface{} {
	var index = args[0].Int()
	if board.cells[index].isAlive() {
		board.cells[index] = DeadCell{}
	} else {
		board.cells[index] = LiveCell{}
	}
	return board.cells[index].isAlive()
}

func randomizeBoard(this js.Value, args []js.Value) interface{} {
	cells := make([]Cell, board.y*board.x)
	for i := 0; i < board.y*board.x; i++ {
		i2 := rand.Int()
		if i2%3 == 0 {
			cells[i] = LiveCell{}
		} else {
			cells[i] = DeadCell{}
		}
	}
	board.cells = cells
	return true
}

func clearBoard(this js.Value, args []js.Value) interface{} {
	print("Safe")
	for i := range board.cells {
		board.cells[i] = DeadCell{}
	}
	return true
}

func contains(a []int, n int) bool {
	for _, v := range a {
		if v == n {
			return true
		}
	}
	return false
}

func convertBoard(cells []Cell) interface{} {
	boolCell := make([]interface{}, len(cells))
	for i := range cells {
		boolCell[i] = cells[i].isAlive()
	}
	return boolCell
}

func applyCustomRules(this js.Value, args []js.Value) interface{} {
	survives := args[0].String()
	born := args[1].String()
	currentRule.s = convertStringRuleToIntArray(survives)
	currentRule.b = convertStringRuleToIntArray(born)
	return convertRulesToString(currentRule)
}

func convertStringRuleToIntArray(rule string) []int {
	split := strings.Split(strings.TrimSpace(rule), "")
	ruleAsInts := make([]int, len(split))
	for i := range ruleAsInts {
		ruleAsInts[i], _ = strconv.Atoi(split[i])
	}
	return ruleAsInts
}

type Rules struct {
	b []int
	s []int
}

var rules map[string]Rules

const (
	ConwaysLife      = "Conway's Life"
	DayAndNight      = "Day & Night"
	Maze             = "Maze"
	Iceballs         = "Iceballs"
	LifeWithoutDeath = "Life without death"
	Seeds            = "Seeds"
	HTrees           = "H-trees"
	Serviettes       = "Serviettes"
	Bacteria         = "Bacteria"
	PedestrianLife   = "Pedestrian Life"
	PulsarLife       = "Pulsar Life"
)

func initRules(this js.Value, args []js.Value) interface{} {
	rules = make(map[string]Rules)
	rules[ConwaysLife] = convertRuleStringToRules("B3/S23")
	rules[DayAndNight] = convertRuleStringToRules("B3678/S34678")
	rules[Maze] = convertRuleStringToRules("B3/S12345")
	rules[Iceballs] = convertRuleStringToRules("B25678/S5678")
	rules[LifeWithoutDeath] = convertRuleStringToRules("B3/S012345678")
	rules[Seeds] = convertRuleStringToRules("B2/S")
	rules[HTrees] = convertRuleStringToRules("B1/S012345678")
	rules[Serviettes] = convertRuleStringToRules("B234/S")
	rules[Bacteria] = convertRuleStringToRules("B34/S456")
	rules[PedestrianLife] = convertRuleStringToRules("B38/S23")
	rules[PulsarLife] = convertRuleStringToRules("B3/S238")
	return getAvailableRules()
}

func setRule(this js.Value, args []js.Value) interface{} {
	rule := args[0].String()
	currentRule = rules[rule]
	return convertRulesToString(currentRule)
}

func getAvailableRules() interface{} {
	var jsRules = make([]interface{}, len(rules))
	i := 0
	for rule, _ := range rules {
		jsRules[i] = rule
		i++
	}
	return jsRules
}

func convertRulesToString(rule Rules) string {
	var b = strings.Trim(strings.Join(strings.Split(fmt.Sprint(rule.b), " "), ""), "[]")
	var s = strings.Trim(strings.Join(strings.Split(fmt.Sprint(rule.s), " "), ""), "[]")
	return fmt.Sprintf("B%s/S%s", b, s)
}

func convertRuleStringToRules(ruleString string) Rules {
	var b string
	var s string
	reg, err := regexp.Compile("[^0-8]+")
	if err != nil {
		panic(err)
	}
	split := strings.Split(ruleString, "/")
	if len(split) != 2 {
		log.Panic("Error while parsing rulestring")
	}

	if strings.Contains(split[0], "B") {
		b = reg.ReplaceAllString(split[0], "")
		s = reg.ReplaceAllString(split[1], "")
	} else if strings.Contains(split[0], "S") {
		b = reg.ReplaceAllString(split[1], "")
		s = reg.ReplaceAllString(split[0], "")
	} else {
		log.Panic("Error while parsing rulestring")
	}

	return Rules{
		b: convertStringRuleToIntArray(b),
		s: convertStringRuleToIntArray(s),
	}
}
