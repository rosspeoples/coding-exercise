import React, { useState, useEffect } from "react";
import _axios from "axios";
const axios = _axios.create({
  adapter: 'fetch'
});


function App() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  const [recentUrls, setRecentUrls] = useState([]);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // URL Validator state
  const [validationUrl, setValidationUrl] = useState("");
  const [validationResponse, setValidationResponse] = useState(null);
  const [validationError, setValidationError] = useState("");

  // Load recent URLs from LocalStorage
  useEffect(() => {
    const storedUrls = localStorage.getItem("recentUrls");
    if (storedUrls) {
      setRecentUrls(JSON.parse(storedUrls));
    }
  }, []);

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError("Please enter a valid URL.");
      return;
    }

    try {
      setError("");
      const hostname = window.location.hostname; // for local development environment
      const response = await axios.post(`http://${hostname}:5000/api/shorten`, { url });
      const { short_url, original_url } = response.data;

      setShortUrl(short_url);
      setOriginalUrl(original_url);

      // Update recent URLs, keeping max 10 entries
      const updatedUrls = [{ original: original_url, short: short_url }, ...recentUrls].slice(0, 10);
      setRecentUrls(updatedUrls);
      localStorage.setItem("recentUrls", JSON.stringify(updatedUrls));

      setUrl(""); // Clear input field
    } catch (error) {
      console.error("Error shortening URL", error);
      setError("Failed to shorten URL. Ensure it is valid and try again.");
    }
  };

  const copyToClipboard = (text, index = null) => {
    navigator.clipboard.writeText(text);
    if (index === null) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } else {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const clearRecentUrls = () => {
    setRecentUrls([]);
    localStorage.removeItem("recentUrls");
  };


  // Function to validate a short URL
  const handleValidateUrl = async () => {
    if (!validationUrl.trim()) {
      setValidationError("Enter a shortened URL to validate.");
      return;
    }

    try {
      setValidationError("");
      setValidationResponse(null);

      const startTime = Date.now();
      const response = await axios.get(validationUrl, {fetchOptions: {redirect: 'manual'}});
      const endTime = Date.now();
      const duration = endTime - startTime;


      setValidationResponse({
        status: response.status,
        headers: response.headers,
        data: response.data,
        time: duration,
      });
    } catch (error) {
      if (error.response) {
        setValidationResponse({
          status: error.response.status,
          headers: error.response.headers,
          data: error.response.data,
          time: "N/A",
        });
      } else {
        setValidationError("Failed to validate URL. Check if it's correct.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-blue-600">URL Shortener</h1>

        {/* URL Input */}
        <div className="mt-4">
          <label className="block text-gray-700 font-medium">Enter URL:</label>

          <form
            onSubmit={(e) => {
              e.preventDefault(); // Prevent page reload
              handleSubmit();
            }}
            className="flex mt-2"
          >
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 p-2 border rounded-l focus:ring focus:ring-blue-300"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 focus:ring focus:ring-blue-300"
            >
              Shorten
            </button>
          </form>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        {/* Shortened URL Display */}
        {shortUrl && (
          <div className="mt-4 p-3 bg-gray-200 rounded flex flex-col">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-600 text-sm">Shortened URL:</span>
                <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline block">
                  {shortUrl}
                </a>
              </div>
              <button
                onClick={() => copyToClipboard(shortUrl)}
                className="text-gray-600 hover:text-black"
                title="Copy to clipboard"
              >
                {copySuccess ? "✔ Copied!" : "📋"}
              </button>
            </div>
            <div className="text-sm text-gray-500 mt-1">Points to: {originalUrl}</div>
          </div>
        )}

        {/* Recently Shortened URLs */}
        <div className="mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recently Shortened</h2>
            <button
              onClick={clearRecentUrls}
              className="text-sm text-red-500 hover:underline"
            >
              Clear All
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Stored locally in your browser, not on the server 😂
          </p>
          <ul className="mt-2">
            {recentUrls.map((item, index) => (
              <li key={index} className="p-2 border-b flex justify-between items-center">
                <a href={item.short} target="_blank" rel="noopener noreferrer" className="text-blue-500 truncate">
                  {item.short}
                </a>
                <div className="flex items-center">
                  <span className="text-gray-500 text-sm truncate mr-2">{item.original}</span>
                  <button
                    onClick={() => copyToClipboard(item.short, index)}
                    className="text-gray-600 hover:text-black"
                    title="Copy to clipboard"
                  >
                    {copiedIndex === index ? "✔" : "📋"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

         {/* URL Validator */}
         
         <div className="mt-6">
          <h2 className="text-lg font-semibold">Validate Shortened URL</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault(); // Prevent page reload
              handleValidateUrl();
            }}
            className="flex mt-2"
          >
            <input
              type="url"
              value={validationUrl}
              onChange={(e) => setValidationUrl(e.target.value)}
              placeholder="Enter shortened URL"
              className="flex-1 p-2 border rounded-l focus:ring focus:ring-blue-300"
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-r hover:bg-green-700 focus:ring focus:ring-green-300"
            >
              Validate
            </button>
          </form>
          {validationError && <p className="text-red-500 text-sm mt-2">{validationError}</p>}
          {validationResponse && (
            <div className="mt-4 p-3 bg-gray-200 rounded">
              <p>Status Code: {validationResponse.status}</p>
              <p>Time Taken: {validationResponse.time} ms</p>
              <p>Response Headers: {JSON.stringify(validationResponse.headers, null, 2)}</p>
              <p>Response Data: {JSON.stringify(validationResponse.data, null, 2)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
