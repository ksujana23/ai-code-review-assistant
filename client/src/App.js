import { useState } from "react";
import axios from "axios";

function App() {
  const [prUrl, setPrUrl] = useState("");
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReview = async () => {
    try {
      setLoading(true);

      const response = await axios.post(
        "https://ai-code-review-assistant3.onrender.com/review",
        {
          prUrl,
        }
      );

      setReview(response.data.review);

    } catch (error) {
      console.error(error);

      setReview("Error reviewing PR");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1>AI Code Review Assistant</h1>

      <input
        type="text"
        placeholder="Paste GitHub PR URL"
        value={prUrl}
        onChange={(e) => setPrUrl(e.target.value)}
        style={{
          width: "500px",
          padding: "10px",
        }}
      />

      <button
        onClick={handleReview}
        style={{
          marginLeft: "10px",
          padding: "10px 20px",
        }}
      >
        Review PR
      </button>

      {loading && <p>Reviewing code...</p>}

      <pre
        style={{
          marginTop: "20px",
          background: "#f4f4f4",
          padding: "20px",
          whiteSpace: "pre-wrap",
        }}
      >
        {review}
      </pre>
    </div>
  );
}

export default App;