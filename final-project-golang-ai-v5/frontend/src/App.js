import React, { useState } from "react";
import axios from "axios";

function App() {
  const [activeTab, setActiveTab] = useState("Ask AI");
  const [file, setFile] = useState(null);
  const [query, setQuery] = useState("");
  const [fileQuery, setFileQuery] = useState("");
  const [response, setResponse] = useState("");
  const [summaryResponse, setSummaryResponse] = useState("");
  const [history, setChatHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(true);
  const [grammarQuery, setGrammarQuery] = useState("");
  const [grammarResponse, setGrammarResponse] = useState("");
  const [translateQuery, setTranslateQuery] = useState("");
  const [translateResponse, setTranslateResponse] = useState("");

  const tabs = ["Ask.Io", "Summary", "Grammar", "Translation"];
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };
  
  // Summary
  const handleUpload = async () => {
    if (!file) {
      alert("Please upload a file before analyzing.");
      return;
    }
    if (!fileQuery) {
      alert("Please provide a question to analyze.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("query", fileQuery);

    try {
      const res = await axios.post("http://localhost:8080/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setSummaryResponse(res.data.answer);
      setChatHistory((prev) => [
        ...prev,
        { question: fileQuery, answer: res.data.answer },
      ]);
    } catch (error) {
      console.error("Error uploading file and query:", error);
      alert("Error processing file: " + (error.response?.data || error.message));
    }
  };
  
  // chat
  const handleChat = async () => {
    if (!query) {
      alert("Please provide a question to chat.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8080/chat", { query });
      setResponse(res.data.answer);
      setChatHistory((prev) => [
        ...prev,
        { question: query, answer: res.data.answer },
      ]);
      setQuery("");
    } catch (error) {
      console.error("Error querying chat:", error);
      alert("Error in chat: " + (error.response?.data || error.message));
    }
  };

  // grammar
  const handleGrammarCheck = async () => {
    if (!grammarQuery) {
      alert("Please provide text for grammar checking.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8080/grammar", {
        query: grammarQuery,
      });
      setGrammarResponse(res.data.corrected_text);
      setChatHistory((prev) => [
        ...prev,
        { question: grammarQuery, answer: res.data.corrected_text },
      ]);
    } catch (error) {
      console.error("Error checking grammar:", error);
      alert("Failed to check grammar: " + (error.response?.data || error.message));
    }
  };

  // translation
  const handleTranslate = async () => {
    if (!translateQuery) {
      alert("Please provide text to translate.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8080/translate", {
        query: translateQuery,
      });
      setTranslateResponse(res.data.translated_text);
      setChatHistory((prev) => [
        ...prev,
        { question: translateQuery, answer: res.data.translated_text },
      ]);
    } catch (error) {
      console.error("Error in translation:", error);
      alert("Failed to translate: " + (error.response?.data || error.message));
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundImage:
          "url('https://images.unsplash.com/photo-1499428665502-503f6c608263?q=80&w=2400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          width: "100%",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
          textAlign: "center",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
<h1
  style={{
    color: "#ffffff",
    marginBottom: "20px",
    animation: "glow 1.5s infinite",
    fontWeight: "bold",
  }}
>
  Ask.Io Chatbot
</h1>
<style>
  {`
    @keyframes glow {
      0% { text-shadow: 0 0 5px #1E90FF, 0 0 10px #1E90FF; }
      50% { text-shadow: 0 0 20px #1E90FF, 0 0 30px #1E90FF; }
      100% { text-shadow: 0 0 5px #1E90FF, 0 0 10px #1E90FF; }
    }
  `}
</style>

<nav
  style={{
    display: "flex",
    padding: "10px",
    background: "#f5f5f5",
    borderRadius: "5px",
    marginBottom: "20px",
    justifyContent: "center",
  }}
>
  {tabs.map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      style={{
        padding: "10px 15px",
        margin: "0 10px",
        border: "none",
        borderRadius: "5px",
        background: activeTab === tab ? "#ffffff" : "transparent",
        color: activeTab === tab ? "#007BFF" : "#333",
        cursor: "pointer",
        boxShadow:
          activeTab === tab
            ? "0 0 15px rgba(255, 255, 255, 0.7)"
            : "none",
        transition: "transform 0.3s ease, background 0.3s ease",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.transform = "scale(1.1)") // Membesar saat hover
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.transform = "scale(1)") // Kembali ke ukuran semula
      }
    >
      {tab}
    </button>
  ))}
</nav>
        {activeTab === "Ask.Io" && (
          <div
            style={{
              marginBottom: "20px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              backgroundColor: "#e0e0e0",
              boxShadow: "0 4px 8px rgba(255, 255, 255, 0.5)",
            }}
          >
            <h2 style={{ color: "#333", marginBottom: "15px" }}>
              
Ask.Io
            </h2>
            <div style={{ display: "flex", marginBottom: "10px" }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask question here..."
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  marginRight: "10px",
                }}
              />
              <button
                onClick={handleChat}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#1E90FF",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Chat
              </button>
            </div>

            {response && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  backgroundColor: "transparent",
                }}
              >
                <h4>Response</h4>
                <p>{response}</p>
              </div>
            )}
          </div>
        )}
        {activeTab === "Summary" && (
          <div
            style={{
              marginBottom: "20px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              backgroundColor: "#e0e0e0",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
            }}
          >
            <h2 style={{ color: "#333", marginBottom: "15px" }}>File Upload</h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              <input
                type="file"
                onChange={handleFileChange}
                accept=".csv"
                style={{
                  flex: "1",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  backgroundColor: "white",
                }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="text"
                value={fileQuery}
                onChange={(e) => setFileQuery(e.target.value)}
                placeholder="Ask a question about the file..."
                style={{
                  flex: "2",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
              <button
                onClick={handleUpload}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#1E90FF",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Upload & Analyze
              </button>
            </div>

            {summaryResponse && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  backgroundColor: "white",
                }}
              >
                <h4>Response</h4>
                <p>{summaryResponse}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "Grammar" && (
          <div
            style={{
              marginBottom: "20px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              backgroundColor: "#e0e0e0",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h2 style={{ color: "#333", marginBottom: "15px" }}>
              Grammar Checker
            </h2>
            <div style={{ display: "flex", marginBottom: "10px" }}>
              <textarea
                value={grammarQuery}
                onChange={(e) => setGrammarQuery(e.target.value)}
                placeholder="Enter text to check grammar..."
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  marginRight: "10px",
                  minHeight: "80px",
                }}
              />
              <button
                onClick={handleGrammarCheck}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#1E90FF",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  alignSelf: "center",
                }}
              >
                Check Grammar
              </button>
            </div>

            {grammarResponse && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  backgroundColor: "#fff",
                }}
              >
                <h4>Corrected Text</h4>
                <p>{grammarResponse}</p>
              </div>
            )}
          </div>
        )}
        {activeTab === "Translation" && (
          <div
            style={{
              marginBottom: "20px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              backgroundColor: "#e0e0e0",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h2 style={{ color: "#333", marginBottom: "15px" }}>
              Indonesian to English Translation
            </h2>
            <div style={{ display: "flex", marginBottom: "10px" }}>
              <textarea
                value={translateQuery}
                onChange={(e) => setTranslateQuery(e.target.value)}
                placeholder="Enter Indonesian text to translate..."
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  marginRight: "10px",
                  minHeight: "80px",
                }}
              />
              <button
                onClick={handleTranslate}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#1E90FF",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  alignSelf: "center",
                }}
              >
                Translate
              </button>
            </div>

            {translateResponse && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  backgroundColor: "#fff",
                }}
              >
                <h4>English Translation</h4>
                <p>{translateResponse}</p>
              </div>
            )}
          </div>
        )}

        {/* Chat History Section */}
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "10px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <h4 style={{ margin: 0 }}>Chat History</h4>
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                border: "none",
                backgroundColor: "transparent",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              {showHistory ? "▼ Hide" : "▲ Show"}
            </button>
          </div>

          {showHistory && (
            <div style={{ maxHeight: "150px", overflowY: "auto" }}>
              {history.length === 0 ? (
                <p style={{ textAlign: "center", color: "#999" }}>
                  No history available
                </p>
              ) : (
                history.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: "10px",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      backgroundColor: "#fff",
                      textAlign: "left",
                    }}
                  >
                    <p style={{ margin: 0 }}>
                      <strong>Q:</strong> {item.question}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>A:</strong> {item.answer}
                    </p>
                  </div>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);
}

export default App;
