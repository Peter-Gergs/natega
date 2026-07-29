import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import AdSlot from "./AdSlot";
import StudentDetails from "./Student";
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const TOP_AD_SLOT = import.meta.env.VITE_ADSENSE_TOP_SLOT || "";
const RESULTS_AD_SLOT = import.meta.env.VITE_ADSENSE_RESULTS_SLOT || "";
const BOTTOM_AD_SLOT = import.meta.env.VITE_ADSENSE_BOTTOM_SLOT || "";
const FACEBOOK_URL = "https://www.facebook.com/smmtrendify";

export function BrandLogo({ compact = false }) {
  const [logoFailed, setLogoFailed] = useState(false);

  if (logoFailed) {
    return (
      <span className={`brand-fallback ${compact ? "compact" : ""}`}>T</span>
    );
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
  const [searchedName, setSearchedName] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  async function fetchResults(query, requestedPage = 1) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/results/search/?q=${encodeURIComponent(query)}&page=${requestedPage}`,
      );

      const contentType = response.headers.get("content-type");
      const data = contentType?.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        throw new Error(data?.error || `تعذر تنفيذ البحث (${response.status})`);
      }

      const nextResults = data?.results || [];

      setResults(nextResults);
      setPage(data?.page || requestedPage);
      setTotalPages(data?.total_pages || 0);
      setTotalCount(data?.total_count || 0);
      setHasMore(Boolean(data?.has_more));
      setHasPrevious(Boolean(data?.has_previous));

      if (!nextResults.length) {
        setMessage("لم يتم العثور على نتائج مطابقة");
      }

      setTimeout(() => {
        document
          .querySelector(".results-section")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } catch (error) {
      setResults([]);
      setTotalPages(0);
      setTotalCount(0);
      setHasMore(false);
      setHasPrevious(false);
      setMessage(error.message || "حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const query = name.trim();

    if (query.length < 3) {
      setMessage("اكتب 3 حروف على الأقل من الاسم");
      setResults([]);
      setPage(1);
      setTotalPages(0);
      setTotalCount(0);
      setHasMore(false);
      setHasPrevious(false);
      return;
    }

    setSearchedName(query);
    setPage(1);

    await fetchResults(query, 1);
  }

  async function goToPage(nextPage) {
    if (loading || !searchedName || nextPage < 1 || nextPage > totalPages) {
      return;
    }

    await fetchResults(searchedName, nextPage);
  }

  function renderPageNumbers() {
    if (totalPages <= 1) {
      return null;
    }

    const visiblePages = [];
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);

    if (startPage > 1) {
      visiblePages.push(1);

      if (startPage > 2) {
        visiblePages.push("start-dots");
      }
    }

    for (let currentPage = startPage; currentPage <= endPage; currentPage++) {
      visiblePages.push(currentPage);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        visiblePages.push("end-dots");
      }

      visiblePages.push(totalPages);
    }

    return (
      <div className="pagination-numbers">
        {visiblePages.map((item) => {
          if (typeof item === "string") {
            return (
              <span className="pagination-dots" key={item}>
                ...
              </span>
            );
          }

          return (
            <button
              key={item}
              type="button"
              className={item === page ? "active" : ""}
              disabled={loading || item === page}
              onClick={() => goToPage(item)}
            >
              {item}
            </button>
          );
        })}
      </div>
    );
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

          <p>
            اكتب ثلاثة أحرف على الأقل من اسم الطالب، ثم اضغط على عرض النتيجة.
          </p>

          <span className="powered-by">إحدى خدمات Trendify Agency</span>
        </header>

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
          <section className="results-section">
            <div className="results-heading">
              <div>
                <span className="section-kicker">نتيجة البحث</span>
                <h2>النتائج المطابقة</h2>
              </div>

              <span className="results-count">{totalCount} نتيجة</span>
            </div>

            <p className="notice">
              الصفحة {page} من {totalPages}
            </p>

            <div className="results-grid">
              {results.map((result) => (
                <a
                  className="student-name-link"
                  href={`/student/${encodeURIComponent(result.seating_no)}`}
                >
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
                        <dd>{result.total_degree ?? "غير متاح"}</dd>
                      </div>

                      <div>
                        <dt>النسبة</dt>
                        <dd>
                          {result.percentage !== null &&
                          result.percentage !== undefined
                            ? `${result.percentage}%`
                            : "غير متاحة"}
                        </dd>
                      </div>

                      <div>
                        <dt>الحالة</dt>
                        <dd>{result.student_case_desc || "غير متاحة"}</dd>
                      </div>
                    </dl>
                  </article>
                </a>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  disabled={loading || !hasPrevious}
                  onClick={() => goToPage(page - 1)}
                >
                  السابق
                </button>

                {renderPageNumbers()}

                <button
                  type="button"
                  disabled={loading || !hasMore}
                  onClick={() => goToPage(page + 1)}
                >
                  التالي
                </button>
              </div>
            )}
          </section>
        )}

        <section className="trendify-card">
          <div className="trendify-card-brand">
            <BrandLogo compact />
          </div>

          <div className="trendify-card-copy">
            <span className="trendify-eyebrow">TRENDIFY AGENCY</span>

            <h2>خلّي مشروعك يظهر بشكل أقوى على الإنترنت</h2>

            <p>
              خدمات تصميم المواقع وبيع التفعيلات لبرامج الـ AI (Canva - Gemini -
              ChatGPT).
            </p>
          </div>

          <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
            تواصل معنا
          </a>
        </section>
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

const studentPathMatch = window.location.pathname.match(
  /^\/student\/([^/]+)\/?$/,
);
const page = studentPathMatch ? (
  <StudentDetails seatingNo={decodeURIComponent(studentPathMatch[1])} />
) : (
  <App />
);

createRoot(document.getElementById("root")).render(page);
