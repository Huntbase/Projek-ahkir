package service

import (
    "bytes"
    "encoding/json"
    "errors"
    "io"
    "log"
    "net/http"
    "strings"
)

type GrammarService struct {
    Client *http.Client
}

func (gs *GrammarService) CheckGrammar(text, token string) (string, error) {
    // Input validation
    text = strings.TrimSpace(text)
    if text == "" {
        return "", errors.New("input text is empty")
    }

    // Using a grammar-specific model
    url := "https://api-inference.huggingface.co/models/vennify/t5-base-grammar-correction"

    // Prepare the request body
    requestBody := map[string]string{
        "inputs": text,
    }

    payload, err := json.Marshal(requestBody)
    if err != nil {
        return "", err
    }

    // Create request
    req, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
    if err != nil {
        return "", err
    }

    // Set headers
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/json")

    // Send request
    resp, err := gs.Client.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()

    // Read response body
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return "", err
    }

    // Log raw response for debugging
    log.Printf("Raw response from API: %s", string(body))

    // Check for Hugging Face specific errors
    var errorResp map[string]interface{}
    if err := json.Unmarshal(body, &errorResp); err == nil {
        if errMsg, exists := errorResp["error"]; exists {
            return "", errors.New(errMsg.(string))
        }
    }

    // Parse response
    var response []map[string]interface{}
    if err := json.Unmarshal(body, &response); err != nil {
        log.Printf("Error parsing response: %v", err)
        return "", err
    }

    // Extract corrected text
    if len(response) > 0 {
        if generatedText, ok := response[0]["generated_text"].(string); ok {
            correctedText := strings.TrimSpace(generatedText)
            if correctedText != "" {
                return correctedText, nil
            }
        }
    }

    // If no valid response, try alternative model
    if err := gs.tryAlternativeModel(text, token); err != nil {
        log.Printf("Alternative model also failed: %v", err)
    }

    return "", errors.New("no valid correction received")
}

func (gs *GrammarService) tryAlternativeModel(text, token string) error {
    // List of alternative models to try
    alternativeModels := []string{
        "prithivida/grammar_error_correcter",
        "flexudy/t5-base-multi-sentence-doctor",
    }

    for _, model := range alternativeModels {
        url := "https://api-inference.huggingface.co/models/" + model
        requestBody := map[string]string{
            "inputs": text,
        }

        payload, err := json.Marshal(requestBody)
        if err != nil {
            continue
        }

        req, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
        if err != nil {
            continue
        }

        req.Header.Set("Authorization", "Bearer "+token)
        req.Header.Set("Content-Type", "application/json")

        resp, err := gs.Client.Do(req)
        if err != nil {
            continue
        }
        defer resp.Body.Close()

        body, err := io.ReadAll(resp.Body)
        if err != nil {
            continue
        }

        log.Printf("Alternative model %s response: %s", model, string(body))
    }

    return errors.New("all alternative models failed")
}