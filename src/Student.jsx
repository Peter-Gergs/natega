import React, { useEffect, useState } from "react";

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";

import { Doughnut } from "react-chartjs-2";

import { BrandLogo } from "./main";
import "./StudentDetails.css";

ChartJS.register(ArcElement, Tooltip, Legend);

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

/* =========================
   Helpers
========================= */

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const normalizedValue = String(value)
    .replace("%", "")
    .replace(",", ".")
    .trim();

  const result = Number.parseFloat(normalizedValue);

  return Number.isFinite(result) ? result : fallback;
}

function clamp(value, minimum = 0, maximum = 100) {
  return Math.min(Math.max(value, minimum), maximum);
}

/*
 * كل الأرقام بالإنجليزي.
 */
function formatNumber(value, options = {}) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "غير متاح";
  }

  return new Intl.NumberFormat("en-US", options).format(numericValue);
}

function formatPercentage(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "غير متاحة";
  }

  return `${formatNumber(numericValue, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;
}

function getSubjectName(subject) {
  return (
    subject?.subject ||
    subject?.name ||
    subject?.subject_name ||
    "مادة غير معروفة"
  );
}

function getSubjectDegreeText(subject) {
  const degree =
    subject?.degree ??
    subject?.mark ??
    subject?.score ??
    subject?.student_degree;

  if (degree === null || degree === undefined || degree === "") {
    return "غير متاحة";
  }

  return String(degree);
}

/*
 * استخراج الدرجة والدرجة النهائية من قيم مثل:
 * 60.5 / 80
 * 80 / 60.5
 * 34 / 60
 */
function parseSubjectDegree(subject) {
  const explicitStudentDegree = toNumber(
    subject?.student_degree ?? subject?.score ?? subject?.mark,
    Number.NaN,
  );

  const explicitMaximumDegree = toNumber(
    subject?.max_degree ??
      subject?.maximum_degree ??
      subject?.max_score ??
      subject?.full_mark,
    Number.NaN,
  );

  if (
    Number.isFinite(explicitStudentDegree) &&
    Number.isFinite(explicitMaximumDegree) &&
    explicitMaximumDegree > 0
  ) {
    return {
      studentDegree: explicitStudentDegree,
      maximumDegree: explicitMaximumDegree,
    };
  }

  const degreeText = getSubjectDegreeText(subject);

  if (degreeText.includes("غير مقرر") || degreeText.includes("غير مقررة")) {
    return null;
  }

  const numbers = degreeText
    .match(/\d+(?:[.,]\d+)?/g)
    ?.map((item) => toNumber(item, Number.NaN))
    .filter(Number.isFinite);

  if (!numbers || numbers.length < 2) {
    return null;
  }

  /*
   * الأكبر غالبًا هو الدرجة النهائية،
   * والأصغر هو درجة الطالب.
   */
  const maximumDegree = Math.max(numbers[0], numbers[1]);
  const studentDegree = Math.min(numbers[0], numbers[1]);

  if (maximumDegree <= 0) {
    return null;
  }

  return {
    studentDegree,
    maximumDegree,
  };
}

function getSubjectPercentage(subject) {
  const directPercentage = subject?.percentage ?? subject?.subject_percentage;

  if (
    directPercentage !== null &&
    directPercentage !== undefined &&
    directPercentage !== ""
  ) {
    return clamp(toNumber(directPercentage));
  }

  const degreeData = parseSubjectDegree(subject);

  if (!degreeData) {
    return null;
  }

  return clamp((degreeData.studentDegree / degreeData.maximumDegree) * 100);
}

/* =========================
   Chart center text
========================= */

const centerTextPlugin = {
  id: "centerText",

  afterDraw(chart) {
    const pluginOptions = chart.options.plugins?.centerText;

    if (!pluginOptions?.text) {
      return;
    }

    const meta = chart.getDatasetMeta(0);
    const arc = meta?.data?.[0];

    if (!arc) {
      return;
    }

    const { ctx } = chart;

    const centerX = arc.x;
    const centerY = arc.y + (pluginOptions.offsetY || 0);

    ctx.save();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = pluginOptions.color || "#1d2230";

    ctx.font = `900 ${
      pluginOptions.fontSize || 26
    }px Tahoma, Arial, sans-serif`;

    ctx.fillText(pluginOptions.text, centerX, centerY);

    if (pluginOptions.subText) {
      ctx.fillStyle = pluginOptions.subColor || "#737b89";

      ctx.font = `700 ${
        pluginOptions.subFontSize || 12
      }px Tahoma, Arial, sans-serif`;

      ctx.fillText(
        pluginOptions.subText,
        centerX,
        centerY + (pluginOptions.subOffsetY || 28),
      );
    }

    ctx.restore();
  },
};

/* =========================
   Total percentage chart
========================= */

function PercentageChart({ percentage, totalDegree }) {
  const safePercentage = clamp(toNumber(percentage));

  const data = {
    datasets: [
      {
        data: [safePercentage, 100 - safePercentage],

        backgroundColor: ["#d81132", "#edf0f5"],

        borderWidth: 0,
        hoverOffset: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "77%",

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        rtl: true,
        textDirection: "rtl",

        callbacks: {
          label(context) {
            return formatPercentage(context.raw);
          },
        },
      },

      centerText: {
        text: formatPercentage(safePercentage),
        subText: `${formatNumber(totalDegree)} / 320`,
        color: "#1d2230",
        subColor: "#737b89",
        fontSize: 27,
        subFontSize: 13,
        subOffsetY: 31,
      },
    },
  };

  return (
    <article className="student-chart-card">
      <div className="chart-card-heading">
        <span>نتيجة الطالب</span>
        <strong>النسبة والمجموع</strong>
      </div>

      <div className="main-doughnut-chart">
        <Doughnut data={data} options={options} plugins={[centerTextPlugin]} />
      </div>

      <p className="chart-description">
        حصل الطالب على <strong>{formatNumber(totalDegree)}</strong> درجة من
        إجمالي <strong>320</strong>
      </p>
    </article>
  );
}

/* =========================
   Ranking gauge
========================= */

function RankingGauge({ ranking }) {
  if (!ranking) {
    return null;
  }

  const rank = Number(ranking.rank_in_division);
  const totalStudents = Number(ranking.division_students_count);

  if (
    !Number.isFinite(rank) ||
    !Number.isFinite(totalStudents) ||
    totalStudents <= 0
  ) {
    return null;
  }

  const betterThanPercentage = clamp(
    ((totalStudents - rank) / totalStudents) * 100,
  );

  const data = {
    datasets: [
      {
        data: [betterThanPercentage, 100 - betterThanPercentage],

        backgroundColor: ["#0f8f67", "#edf0f5"],

        borderWidth: 0,
        circumference: 180,
        rotation: 270,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    rotation: 270,
    circumference: 180,

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        rtl: true,
        textDirection: "rtl",

        callbacks: {
          label(context) {
            return formatPercentage(context.raw);
          },
        },
      },

      centerText: {
        text: `#${formatNumber(rank)}`,
        subText: `من ${formatNumber(totalStudents)}`,
        color: "#1d2230",
        subColor: "#737b89",
        fontSize: 28,
        subFontSize: 13,
        offsetY: 22,
        subOffsetY: 29,
      },
    },
  };

  return (
    <article className="student-chart-card ranking-gauge-card">
      <div className="chart-card-heading">
        <span>الترتيب داخل الشعبة</span>
        <strong>{ranking.division || "شعبة الطالب"}</strong>
      </div>

      <div className="ranking-gauge-chart">
        <Doughnut data={data} options={options} plugins={[centerTextPlugin]} />
      </div>

      <div className="ranking-highlight">
        <span>الطالب أفضل من</span>

        <strong>{formatPercentage(betterThanPercentage)}</strong>

        <small>من طلاب شعبة {ranking.division || "الطالب"}</small>
      </div>
    </article>
  );
}

/* =========================
   Subject circle
========================= */

function SubjectChart({ subject }) {
  const subjectName = getSubjectName(subject);
  const percentage = getSubjectPercentage(subject);
  const degreeData = parseSubjectDegree(subject);
  const degreeText = getSubjectDegreeText(subject);

  const isNotAssigned =
    degreeText.includes("غير مقرر") || degreeText.includes("غير مقررة");

  const safePercentage = percentage === null ? 0 : clamp(percentage);

  const data = {
    datasets: [
      {
        data: [safePercentage, 100 - safePercentage],

        backgroundColor: ["#d81132", "#edf0f5"],

        borderWidth: 0,
        hoverOffset: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "76%",

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        enabled: percentage !== null,

        rtl: true,
        textDirection: "rtl",

        callbacks: {
          label(context) {
            return formatPercentage(context.raw);
          },
        },
      },

      centerText: {
        text: percentage !== null ? formatPercentage(percentage) : "—",

        color: percentage !== null ? "#1d2230" : "#9ca3af",

        fontSize: 19,
      },
    },
  };

  let displayedDegree = degreeText;

  if (degreeData) {
    displayedDegree = `${formatNumber(degreeData.studentDegree, {
      maximumFractionDigits: 2,
    })} / ${formatNumber(degreeData.maximumDegree, {
      maximumFractionDigits: 2,
    })}`;
  }

  return (
    <article className="subject-result-card">
      <div className="subject-result-info">
        <span>المادة</span>
        <h3>{subjectName}</h3>

        <div className="subject-degree-value">
          <span>الدرجة</span>

          <strong>{isNotAssigned ? "غير مقرر" : displayedDegree}</strong>
        </div>
      </div>

      <div className="subject-chart-container">
        <Doughnut data={data} options={options} plugins={[centerTextPlugin]} />
      </div>
    </article>
  );
}

/* =========================
   Main component
========================= */

function StudentDetails({ seatingNo }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadStudent() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/results/${encodeURIComponent(seatingNo)}/`,
          {
            signal: controller.signal,
          },
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.error || data?.detail || "تعذر تحميل بيانات الطالب",
          );
        }

        setStudent(data);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "حدث خطأ أثناء تحميل النتيجة");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (!seatingNo) {
      setError("رقم جلوس الطالب غير موجود");
      setLoading(false);
      return undefined;
    }

    loadStudent();

    return () => controller.abort();
  }, [seatingNo]);

  const subjects = Array.isArray(student?.subjects) ? student.subjects : [];

  const percentage = student?.percentage ?? student?.total_percentage ?? 0;

  return (
    <div className="app-shell student-details-shell" dir="rtl">
      <nav className="brand-bar" aria-label="Trendify Agency">
        <a href="/" className="brand-link">
          <BrandLogo compact />

          <span className="brand-copy">
            <strong>TRENDIFY AGENCY</strong>
            <small>نتيجة الثانوية العامة 2026</small>
          </span>
        </a>

        <a className="facebook-link student-back-top" href="/">
          العودة للبحث
        </a>
      </nav>

      <main className="page student-page">
        {loading && (
          <div className="message student-loading-message">
            جاري تحميل بيانات الطالب...
          </div>
        )}

        {error && (
          <div className="message student-error-message">
            <strong>تعذر عرض النتيجة</strong>
            <span>{error}</span>
            <a href="/">العودة إلى البحث</a>
          </div>
        )}

        {student && !loading && !error && (
          <>
            <section className="student-hero">
              <span className="badge">بيانات الطالب</span>

              <h1>{student.arabic_name || "اسم الطالب غير متاح"}</h1>

              <div className="student-hero-meta">
                <span>
                  رقم الجلوس
                  <strong>{student.seating_no}</strong>
                </span>

                <span className="hero-total-degree">
                  المجموع
                  <strong>
                    {formatNumber(student.total_degree, {
                      maximumFractionDigits: 2,
                    })}
                    {" / 320"}
                  </strong>
                </span>

                <span>
                  النسبة
                  <strong>{formatPercentage(toNumber(percentage))}</strong>
                </span>

                <span>
                  الشعبة
                  <strong>{student.division || "غير متاحة"}</strong>
                </span>

                <span
                  className={`student-status ${
                    student.student_case_desc?.includes("ناجح")
                      ? "student-status-success"
                      : student.student_case_desc?.includes("راسب")
                        ? "student-status-failed"
                        : ""
                  }`}
                >
                  {student.student_case_desc || "الحالة غير متاحة"}
                </span>
              </div>
            </section>

            <section className="student-charts-grid">
              <PercentageChart
                percentage={percentage}
                totalDegree={student.total_degree}
              />

              <RankingGauge ranking={student.ranking} />
            </section>

            {student.ranking && (
              <section className="details-card">
                <div className="student-section-heading">
                  <span className="section-kicker">تفاصيل الترتيب</span>

                  <h2>
                    ترتيب الطالب في شعبة{" "}
                    {student.ranking.division || student.division}
                  </h2>
                </div>

                <div className="ranking-grid">
                  <article>
                    <span>الترتيب داخل الشعبة</span>

                    <strong>
                      {formatNumber(student.ranking.rank_in_division)}
                    </strong>

                    <small>
                      من {formatNumber(student.ranking.division_students_count)}{" "}
                      طالب
                    </small>
                  </article>

                  <article>
                    <span>ترتيب المجموع بعد دمج المكرر</span>

                    <strong>
                      {formatNumber(student.ranking.distinct_score_rank)}
                    </strong>

                    <small>
                      من {formatNumber(student.ranking.distinct_scores_count)}{" "}
                      مجموع مختلف
                    </small>
                  </article>

                  <article>
                    <span>الطلاب بنفس المجموع</span>

                    <strong>
                      {formatNumber(student.ranking.same_score_students_count)}
                    </strong>

                    <small>طالب حاصل على نفس المجموع</small>
                  </article>
                </div>
              </section>
            )}

            <section className="details-card subjects-details-card">
              <div className="student-section-heading subjects-heading">
                <div>
                  <span className="section-kicker">تفاصيل الدرجات</span>

                  <h2>درجات المواد</h2>
                </div>

                <span className="student-subjects-count">
                  {formatNumber(subjects.length)} مادة
                </span>
              </div>

              {subjects.length > 0 ? (
                <div className="subjects-cards-grid">
                  {subjects.map((subject, index) => (
                    <SubjectChart
                      key={`${
                        subject.subject || subject.name || "subject"
                      }-${index}`}
                      subject={subject}
                    />
                  ))}
                </div>
              ) : (
                <p className="student-empty-notice">
                  لا توجد درجات تفصيلية مسجلة لهذا الطالب.
                </p>
              )}
            </section>

            <div className="student-bottom-actions">
              <a className="back-to-search" href="/">
                العودة إلى البحث
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default StudentDetails;
