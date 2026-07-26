import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import AdSlot from "./AdSlot";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
const TOP_AD_SLOT = import.meta.env.VITE_ADSENSE_TOP_SLOT || "";
const RESULTS_AD_SLOT = import.meta.env.VITE_ADSENSE_RESULTS_SLOT || "";
const BOTTOM_AD_SLOT = import.meta.env.VITE_ADSENSE_BOTTOM_SLOT || "";
const FACEBOOK_URL = "https://www.facebook.com/smmtrendify";

function BrandLogo({ compact = false }) {
  const [logoFailed, setLogoFailed] = useState(false);

  if (logoFailed) {
    return <span className={`brand-fallback ${compact ? "compact" : ""}`}>T</span>;
  }

  return (
    <img
      className={`brand-logo ${compact ? "compact" : ""}`}
      src="/trendify-logo.png"
      alt="شعار Trendify Agency"
      onError={() => setLogoFailed(true)}
    />
  );
}

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
      setHasMore(false);
      return;
    }

    setLoading(true);
    setMessage("");
    setResults([]);
    setHasMore(false);

    try {
      const response = await fetch(
        `${API_URL}/results/search/?name=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذر تنفيذ البحث");
      }

      const nextResults = data.results || [];
      setResults(nextResults);
      setHasMore(Boolean(data.has_more));

      if (!nextResults.length) {
        setMessage("لم يتم العثور على نتائج مطابقة");
      }
    } catch (error) {
      setMessage(error.message || "حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <nav className="brand-bar" aria-label="Trendify Agency">
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="brand-link"
        >
          <BrandLogo compact />
          <span className="brand-copy">
            <strong>TRENDIFY AGENCY</strong>
            <small>خدمات رقمية ومنتجات الكترونية</small>
          </span>
        </a>

        <a
          className="facebook-link"
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          تابعنا على فيسبوك
        </a>
      </nav>

      <main className="page">
        <header className="hero">
          <div className="hero-logo-wrap">
            <BrandLogo />
          </div>
          <span className="badge">نتيجة الثانوية العامة 2026</span>
          <h1>اعرف نتيجتك بالاسم</h1>
          <p>اكتب ثلاثة أحرف على الأقل من اسم الطالب، ثم اضغط على عرض النتيجة.</p>
          <span className="powered-by">إحدى خدمات Trendify Agency</span>
        </header>

        <AdSlot slot={TOP_AD_SLOT} label="إعلان أعلى البحث" className="ad-top" />

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
                disabled={loading}
              />
              <button disabled={loading} type="submit">
                {loading ? "جاري البحث..." : "عرض النتيجة"}
              </button>
            </div>
          </form>
        </section>

        {message && <div className="message">{message}</div>}

        {results.length > 0 && (
          <AdSlot slot={RESULTS_AD_SLOT} label="إعلان قبل النتائج" className="ad-results" />
        )}

        {results.length > 0 && (
          <section className="results-section">
            <div className="results-heading">
              <div>
                <span className="section-kicker">نتيجة البحث</span>
                <h2>النتائج المطابقة</h2>
              </div>
              <span className="results-count">{results.length} نتيجة</span>
            </div>

            {hasMore && (
              <p className="notice">هناك نتائج إضافية؛ اكتب اسمًا أكثر تحديدًا.</p>
            )}

            <div className="results-grid">
              {results.map((result) => (
                <article className="result-card" key={result.seating_no}>
                  <div className="result-card-line" />
                  <h3>{result.arabic_name}</h3>
                  <dl>
                    <div>
                      <dt>رقم الجلوس</dt>
                      <dd>{result.seating_no}</dd>
                    </div>
                    <div>
                      <dt>المجموع</dt>
                      <dd>{result.total_degree}</dd>
                    </div>
                    <div>
                      <dt>النسبة</dt>
                      <dd>{result.percentage}%</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="trendify-card">
          <div className="trendify-card-brand">
            <BrandLogo compact />
          </div>
          <div className="trendify-card-copy">
            <span className="trendify-eyebrow">TRENDIFY AGENCY</span>
            <h2>خلّي مشروعك يظهر بشكل أقوى على الإنترنت</h2>
            <p>خدمات تصميم المواقع وبيع التفعيلات لبرامج ال AI (Canva - Gemini - Chatgpt).</p>
          </div>
          <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
            تواصل معنا
          </a>
        </section>

        <AdSlot slot={BOTTOM_AD_SLOT} label="إعلان أسفل النتائج" className="ad-bottom" />
      </main>

      <footer className="site-footer">
        <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
          <BrandLogo compact />
          <span>Trendify Agency</span>
        </a>
        <p>نتيجة الثانوية العامة 2026 — إحدى خدمات Trendify Agency</p>
        <small>© 2026 جميع الحقوق محفوظة.</small>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
