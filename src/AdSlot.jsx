import { useEffect } from "react";

const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || "";

export default function AdSlot({ slot, label = "مساحة إعلانية", className = "" }) {
  const adsEnabled = Boolean(ADSENSE_CLIENT && slot);

  useEffect(() => {
    if (!adsEnabled) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      // Ad blockers or a delayed AdSense script should not break the page.
      console.warn("AdSense could not initialise this slot", error);
    }
  }, [adsEnabled, slot]);

  return (
    <aside className={`ad-container ${className}`.trim()} aria-label="إعلان">
      <span className="ad-label">إعلان</span>
      {adsEnabled ? (
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className="ad-placeholder">
          <strong>{label}</strong>
          <small>تظهر هنا بعد إضافة بيانات شبكة الإعلانات في ملف .env</small>
        </div>
      )}
    </aside>
  );
}
