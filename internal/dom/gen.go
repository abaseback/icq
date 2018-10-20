// +build ignore

package main

import (
	"fmt"
	"io/ioutil"
	"os"
)

func main() {
	file, err := os.Create("template.go")
	if err != nil {
		panic(err)
	}
	defer file.Close()

	fmt.Fprintln(file, "// Code generated by go generate; DO NOT EDIT.")
	fmt.Fprintln(file, "package dom")
	fmt.Fprintln(file)

	var html []byte
	if html, err = ioutil.ReadFile("page.html"); err != nil {
		panic(err)
	}

	fmt.Fprintln(file, "const htmlTemplate = `")
	fmt.Fprintf(file, "%s", html)
	fmt.Fprintln(file, "`")
	fmt.Fprintln(file)

	var js []byte
	if js, err = ioutil.ReadFile("page.js"); err != nil {
		panic(err)
	}

	fmt.Fprintln(file, "const jsTemplate = `")
	fmt.Fprintf(file, "%s", js)
	fmt.Fprintln(file, "`")
}
