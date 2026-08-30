import { useState } from "react";

export default function Home() {
  const [tokens, setTokens] = useState([
    {
      name: "",
      symbol: "",
      supply: "1000000000",
      chain: "base",
    },
  ]);

  const [results, setResults] = useState([]);

  function updateToken(index, field, value) {
    const next = [...tokens];
    next[index][field] = value;
    setTokens(next);
  }

  function addToken() {
    setTokens([
      ...tokens,
      {
        name: "",
        symbol: "",
        supply: "1000000000",
        chain: "base",
      },
    ]);
  }

  function removeToken(index) {
    if (tokens.length === 1) return;
    setTokens(tokens.filter((_, i) => i !== index));
  }

  async function deployAll(simulateOnly = true) {
    setResults([]);

    const response = await fetch("/api/deploy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tokens,
        simulateOnly,
      }),
    });

    const data = await response.json();
    setResults(data.results || []);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#09090b",
        color: "#fff",
        padding: "30px 18px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "auto" }}>
        <h1 style={{ fontSize: 34, marginBottom: 5 }}>
          🚀 Bankr Token Factory
        </h1>

        <p style={{ color: "#a1a1aa", marginBottom: 30 }}>
          Batch token deployment powered by Bankr
        </p>

        {tokens.map((token, index) => (
          <div
            key={index}
            style={{
              background: "#18181b",
              border: "1px solid #27272a",
              borderRadius: 14,
              padding: 20,
              marginBottom: 15,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 15,
              }}
            >
              <strong>Token #{index + 1}</strong>

              <button
                onClick={() => removeToken(index)}
                style={{
                  background: "#3f1818",
                  color: "#ff7777",
                  border: 0,
                  borderRadius: 8,
                  padding: "7px 12px",
                }}
              >
                Remove
              </button>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <input
                placeholder="Token name"
                value={token.name}
                onChange={(e) =>
                  updateToken(index, "name", e.target.value)
                }
              />

              <input
                placeholder="Symbol"
                value={token.symbol}
                onChange={(e) =>
                  updateToken(index, "symbol", e.target.value.toUpperCase())
                }
              />

              <input
                placeholder="Total supply"
                value={token.supply}
                onChange={(e) =>
                  updateToken(index, "supply", e.target.value)
                }
              />

              <select
                value={token.chain}
                onChange={(e) =>
                  updateToken(index, "chain", e.target.value)
                }
              >
                <option value="base">Base</option>
                <option value="robinhood">Robinhood Chain</option>
              </select>
            </div>
          </div>
        ))}

        <button
          onClick={addToken}
          style={{
            width: "100%",
            padding: 15,
            borderRadius: 10,
            border: "1px solid #3f3f46",
            background: "#18181b",
            color: "#fff",
            fontSize: 16,
            marginBottom: 12,
          }}
        >
          + Add Token
        </button>

        <button
          onClick={() => deployAll(true)}
          style={{
            width: "100%",
            padding: 17,
            borderRadius: 10,
            border: 0,
            background: "#27272a",
            color: "#fff",
            fontSize: 17,
            marginBottom: 10,
          }}
        >
          🧪 SIMULATE ALL
        </button>

        <button
          onClick={() => {
            if (
              confirm(
                "This will send real deployment requests to Bankr. Continue?"
              )
            ) {
              deployAll(false);
            }
          }}
          style={{
            width: "100%",
            padding: 18,
            borderRadius: 10,
            border: 0,
            background: "#2563eb",
            color: "#fff",
            fontSize: 18,
            fontWeight: "bold",
          }}
        >
          🚀 DEPLOY ALL
        </button>

        {results.length > 0 && (
          <div style={{ marginTop: 30 }}>
            <h2>Results</h2>

            {results.map((result, index) => (
              <div
                key={index}
                style={{
                  background: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: 10,
                  padding: 15,
                  marginBottom: 10,
                }}
              >
                <strong>
                  {result.name || `Token #${index + 1}`}
                </strong>

                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    color: "#a1a1aa",
                  }}
                >
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        input,
        select {
          width: 100%;
          box-sizing: border-box;
          padding: 14px;
          border-radius: 9px;
          border: 1px solid #3f3f46;
          background: #09090b;
          color: white;
          font-size: 15px;
        }

        button {
          cursor: pointer;
        }
      `}</style>
    </main>
  );
}
