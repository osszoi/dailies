package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

const (
	defaultModel = "gpt-5.4"
	apiURL       = "https://api.openai.com/v1/responses"
)

const systemPrompt = `You are a meeting notes processor for a tech team lead. You receive raw, unformatted notes written during or right after meetings — dailies, 1:1s, planning sessions, or any other team meeting.

The notes are written in the moment and may be messy. They can contain a mix of:
- Things the note-taker needs to do (their own action items)
- Things they heard from others (updates, decisions, opinions)
- Commitments other people made out loud ("X said they'd do Y")
- Commitments the note-taker made ("I agreed to do Z")
- Personal reminders or follow-ups to self
- Blockers, concerns, or open questions

Your job is to turn them into clean, structured notes. Output strictly in this format:
- Line 1: "title: <concise and descriptive title for this meeting>"
- Line 2 onwards: the organized notes in markdown

For the body, use sections that make sense given the content. Always consider including:
- What each person is working on (with names)
- Key decisions made
- Blockers or issues raised
- My action items (things the note-taker committed to or needs to follow up on) — format each item as a markdown checkbox: - [ ] item. ONLY the note-taker's items get checkboxes.
- Their action items (things others committed to, with names) — regular bullet points, no checkboxes
- Personal reminders or notes to self

Be concise. Use bullet points. No fluff, no filler sentences.`

type request struct {
	Model        string `json:"model"`
	Instructions string `json:"instructions"`
	Input        string `json:"input"`
	Store        bool   `json:"store"`
}

type response struct {
	Output []struct {
		Type    string `json:"type"`
		Content []struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"content"`
	} `json:"output"`
	Error *struct {
		Message string `json:"message"`
		Code    string `json:"code"`
	} `json:"error"`
}

func main() {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		fmt.Fprintln(os.Stderr, "OPENAI_API_KEY not set")
		os.Exit(1)
	}

	model := os.Getenv("OPENAI_MODEL")
	if model == "" {
		model = defaultModel
	}

	rawDir := filepath.Join("notes", "raw")
	processedDir := filepath.Join("notes", "processed")

	if err := os.MkdirAll(processedDir, 0755); err != nil {
		fmt.Fprintf(os.Stderr, "failed to create processed dir: %v\n", err)
		os.Exit(1)
	}

	rawFiles, err := filepath.Glob(filepath.Join(rawDir, "*.md"))
	if err != nil || len(rawFiles) == 0 {
		fmt.Println("no raw files found")
		return
	}

	processed := map[string]bool{}
	if entries, err := os.ReadDir(processedDir); err == nil {
		for _, e := range entries {
			processed[e.Name()] = true
		}
	}

	pending := []string{}
	for _, f := range rawFiles {
		if !processed[filepath.Base(f)] {
			pending = append(pending, f)
		}
	}

	if len(pending) == 0 {
		fmt.Println("nothing to process")
		return
	}

	fmt.Printf("processing %d file(s) with model %s\n\n", len(pending), model)

	for _, rawPath := range pending {
		name := filepath.Base(rawPath)
		fmt.Printf("→ %s ... ", name)

		raw, err := os.ReadFile(rawPath)
		if err != nil {
			fmt.Printf("error reading file: %v\n", err)
			continue
		}

		result, err := callOpenAI(apiKey, model, string(raw))
		if err != nil {
			fmt.Printf("api error: %v\n", err)
			continue
		}

		outPath := filepath.Join(processedDir, name)
		if err := os.WriteFile(outPath, []byte(result), 0644); err != nil {
			fmt.Printf("error writing file: %v\n", err)
			continue
		}

		fmt.Println("done")
	}
}

func callOpenAI(apiKey, model, input string) (string, error) {
	body, err := json.Marshal(request{
		Model:        model,
		Instructions: systemPrompt,
		Input:        input,
		Store:        false,
	})
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest(http.MethodPost, apiURL, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var apiResp response
	if err := json.Unmarshal(raw, &apiResp); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	if apiResp.Error != nil {
		return "", fmt.Errorf("%s (%s)", apiResp.Error.Message, apiResp.Error.Code)
	}

	for _, item := range apiResp.Output {
		if item.Type != "message" {
			continue
		}
		for _, c := range item.Content {
			if c.Type == "output_text" {
				return strings.TrimSpace(c.Text), nil
			}
		}
	}

	return "", fmt.Errorf("no output_text found in response")
}
