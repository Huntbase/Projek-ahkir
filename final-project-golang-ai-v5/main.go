package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"

	"a21hc3NpZ25tZW50/service"

	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

// Initialize the services
var fileService = &service.FileService{}
var aiService = &service.AIService{Client: &http.Client{}}
var grammarService = &service.GrammarService{Client: &http.Client{}}
var store = sessions.NewCookieStore([]byte("my-key"))

func getSession(r *http.Request) *sessions.Session {
	session, _ := store.Get(r, "chat-session")
	return session
}

func main() {
	// Load the .env file
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// Retrieve the Hugging Face token from the environment variables
	token := os.Getenv("HUGGINGFACE_TOKEN")
	if token == "" {
		log.Fatal("HUGGINGFACE_TOKEN is not set in the .env file")
	}

	// Set up the router
	router := mux.NewRouter()

	// File upload endpoint
	router.HandleFunc("/upload", func(w http.ResponseWriter, r *http.Request) {
		err := r.ParseMultipartForm(10 << 20) // 10MB max size
		if err != nil {
			http.Error(w, "Unable to parse form", http.StatusBadRequest)
			return
		}

		file, _, err := r.FormFile("file")
		if err != nil {
			http.Error(w, "Unable to retrieve file", http.StatusBadRequest)
			return
		}
		defer file.Close()

		query := r.FormValue("query")
		if query == "" {
			http.Error(w, "Query is required", http.StatusBadRequest)
			return
		}

		fileContent, err := io.ReadAll(file)
		if err != nil {
			http.Error(w, "Unable to read file", http.StatusInternalServerError)
			return
		}

		processedData, err := fileService.ProcessFile(string(fileContent))
		if err != nil {
			http.Error(w, "Failed to process file: "+err.Error(), http.StatusInternalServerError)
			return
		}

		analysisResult, err := aiService.AnalyzeData(processedData, query, token)
		if err != nil {
			http.Error(w, "Failed to analyze data: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status": "success",
			"answer": analysisResult,
		})
	}).Methods("POST")

	// Chat endpoint
	router.HandleFunc("/chat", func(w http.ResponseWriter, r *http.Request) {
		var requestBody struct {
			Query string `json:"query"`
		}
		if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		session := getSession(r)
		context, _ := session.Values["context"].(string)

		chatResponse, err := aiService.ChatWithAI(context, requestBody.Query, token)
		if err != nil {
			http.Error(w, "Failed to chat with AI: "+err.Error(), http.StatusInternalServerError)
			return
		}

		session.Values["context"] = context + "\n" + requestBody.Query + "\n" + chatResponse.GeneratedText
		session.Save(r, w)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status": "success",
			"answer": chatResponse.GeneratedText,
		})
	}).Methods("POST")

	// Grammar check endpoint
	router.HandleFunc("/grammar", func(w http.ResponseWriter, r *http.Request) {
		log.Println("Received request for /grammar")

		// Read and log the raw request body
		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			log.Printf("Error reading request body: %v", err)
			http.Error(w, "Unable to read request body", http.StatusBadRequest)
			return
		}
		r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
		log.Printf("Raw request body: %s", string(bodyBytes))

		// Parse the request body
		var requestBody struct {
			Query string `json:"query"`
		}
		if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
			log.Printf("Error decoding request body: %v", err)
			http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
			return
		}

		if requestBody.Query == "" {
			http.Error(w, "Query is required", http.StatusBadRequest)
			return
		}

		// Process grammar check
		grammarResult, err := grammarService.CheckGrammar(requestBody.Query, token)
		if err != nil {
			log.Printf("Error in grammar checking: %v", err)
			http.Error(w, "Failed to check grammar: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Return response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":         "success",
			"corrected_text": grammarResult,
		})
	}).Methods("POST")

	// Enable CORS
	corsHandler := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:3000"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type", "Authorization"},
	}).Handler(router)
	// Add this with your other service initializations
	var translationService = &service.TranslationService{Client: &http.Client{}}

	// Add this new endpoint with your other endpoints
	router.HandleFunc("/translate", func(w http.ResponseWriter, r *http.Request) {
		log.Println("Received request for /translate")

		var requestBody struct {
			Query string `json:"query"`
		}
		if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
			log.Printf("Error decoding request body: %v", err)
			http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
			return
		}

		if requestBody.Query == "" {
			http.Error(w, "Query is required", http.StatusBadRequest)
			return
		}

		translatedText, err := translationService.TranslateText(requestBody.Query, token)
		if err != nil {
			log.Printf("Error in translation: %v", err)
			http.Error(w, "Failed to translate: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":          "success",
			"translated_text": translatedText,
		})
	}).Methods("POST")
	// Start the server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server running on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, corsHandler))
}
