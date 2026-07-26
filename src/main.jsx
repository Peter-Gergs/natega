import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

function App() {
  const [name, setName] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [hasMore, setHasMore] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const query = name.trim();
    if (query.length < 3) {
      setMessage("اكتب 3 حروف على الأقل من الاسم");
      setResults([]);
      return;
    }

    setLoading(true);
    setMessage("");
    setResults([]);
    try {
      const response = await fetch(`${API_URL}/results/search/?name=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر تنفيذ البحث");
      setResults(data.results || []);
      setHasMore(Boolean(data.has_more));
      if (!data.results?.length) setMessage("لم يتم العثور على نتائج مطابقة");
    } catch (error) {
      setMessage(error.message || "حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <header className="hero">
        <span className="badge">نتيجة الثانوية العامة</span>
        <h1>ابحث عن النتيجة بالاسم</h1>
        <p>اكتب ثلاثة أحرف على الأقل. يمكنك كتابة الاسم كاملًا أو جزءًا منه.</p>
      </header>

      <div className="ad-slot">مساحة إعلانية</div>

      <section className="search-card">
        <form onSubmit={handleSubmit}>
          <label htmlFor="student-name">اسم الطالب</label>
          <div className="search-row">
            <input
              id="student-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="مثال: محمد أحمد محمود"
              autoComplete="off"
            />
            <button disabled={loading} type="submit">
              {loading ? "جاري البحث..." : "عرض النتيجة"}
            </button>
          </div>
        </form>
      </section>

      {message && <div className="message">{message}</div>}

      {results.length > 0 && (
        <section className="results-section">
          <div className="results-heading">
            <h2>النتائج المطابقة</h2>
            <span>{results.length} نتيجة</span>
          </div>
          {hasMore && <p className="notice">هناك نتائج إضافية؛ اكتب اسمًا أكثر تحديدًا.</p>}
          <div className="results-grid">
            {results.map((result) => (
              <article className="result-card" key={result.seating_no}>
                <h3>{result.arabic_name}</h3>
                <dl>
                  <div><dt>رقم الجلوس</dt><dd>{result.seating_no}</dd></div>
                  <div><dt>المجموع</dt><dd>{result.total_degree}</dd></div>
                  <div><dt>النسبة</dt><dd>{result.percentage}%</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="ad-slot">مساحة إعلانية بعد النتائج</div>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
