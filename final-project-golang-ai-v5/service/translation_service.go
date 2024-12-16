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

type TranslationService struct {
    Client *http.Client
}

func (ts *TranslationService) TranslateText(text, token string) (string, error) {
    text = strings.TrimSpace(text)
    if text == "" {
        return "", errors.New("input text is empty")
    }
    
    // Using Helsinki-NLP's Indonesian-English model as primary
    url := "https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-id-en"
    requestBody := map[string]string{
        "inputs": text,
    }
    payload, err := json.Marshal(requestBody)
    if err != nil {
        return "", err
    }

    req, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
    if err != nil {
        return "", err
    }
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/json")

    resp, err := ts.Client.Do(req)
    if err != nil {
        return ts.tryAlternativeModel(text, token)
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return "", err
    }
    log.Printf("Translation response: %s", string(body))

    // Check for errors
    var errorResp map[string]interface{}
    if err := json.Unmarshal(body, &errorResp); err == nil {
        if _, exists := errorResp["error"]; exists {
            return ts.tryAlternativeModel(text, token)
        }
    }

    var response []map[string]interface{}
    if err := json.Unmarshal(body, &response); err != nil {
        return ts.tryAlternativeModel(text, token)
    }
    if len(response) > 0 {
        if translatedText, ok := response[0]["translation_text"].(string); ok {
            return strings.TrimSpace(translatedText), nil
        }
    }

    return ts.tryAlternativeModel(text, token)
}

func (ts *TranslationService) tryAlternativeModel(text, token string) (string, error) {
    // List of alternative models in order of preference 
    models := []struct {
        url  string
        body map[string]interface{}
    }{
        {
            url: "https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M",
            body: map[string]interface{}{
                "inputs": text,
                "parameters": map[string]string{
                    "src_lang": "ind_Latn",
                    "tgt_lang": "eng_Latn",
                },
            },
        },
        {
            url: "https://api-inference.huggingface.co/models/indonesian-nlp/nllb-indonesian-english",
            body: map[string]interface{}{
                "inputs": text,
            },
        },
    }

    for _, model := range models {
        payload, err := json.Marshal(model.body)
        if err != nil {
            continue
        }

        req, err := http.NewRequest("POST", model.url, bytes.NewBuffer(payload))
        if err != nil {
            continue
        }
        req.Header.Set("Authorization", "Bearer "+token)
        req.Header.Set("Content-Type", "application/json")

        resp, err := ts.Client.Do(req)
        if err != nil {
            continue
        }
        defer resp.Body.Close() // Menggunakan defer untuk menutup resp.Body

        body, err := io.ReadAll(resp.Body)
        if err != nil {
            continue
        }
        log.Printf("Alternative model response: %s", string(body))

        var response []map[string]interface{}
        if err := json.Unmarshal(body, &response); err != nil {
            continue
        }
        if len(response) > 0 {
            if translatedText, ok := response[0]["generated_text"].(string); ok {
                return strings.TrimSpace(translatedText), nil
            }
        }
    }

    return "", errors.New("translation failed with all models")
}