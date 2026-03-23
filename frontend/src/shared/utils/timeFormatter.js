/**
 * Format date to relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @param {string} language - Language code ('en' or 'vi')
 * @returns {string} Formatted relative time
 */
export const formatRelativeTime = (date, language = 'en') => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    const translations = {
        en: {
            justNow: 'Just now',
            secondsAgo: (n) => `${n} second${n > 1 ? 's' : ''} ago`,
            minutesAgo: (n) => `${n} minute${n > 1 ? 's' : ''} ago`,
            hoursAgo: (n) => `${n} hour${n > 1 ? 's' : ''} ago`,
            daysAgo: (n) => `${n} day${n > 1 ? 's' : ''} ago`,
            monthsAgo: (n) => `${n} month${n > 1 ? 's' : ''} ago`,
            yearsAgo: (n) => `${n} year${n > 1 ? 's' : ''} ago`
        },
        vi: {
            justNow: 'Vừa xong',
            secondsAgo: (n) => `${n} giây trước`,
            minutesAgo: (n) => `${n} phút trước`,
            hoursAgo: (n) => `${n} giờ trước`,
            daysAgo: (n) => `${n} ngày trước`,
            monthsAgo: (n) => `${n} tháng trước`,
            yearsAgo: (n) => `${n} năm trước`
        }
    };

    const t = translations[language] || translations.en;

    if (diffSec < 10) return t.justNow;
    if (diffSec < 60) return t.secondsAgo(diffSec);
    if (diffMin < 60) return t.minutesAgo(diffMin);
    if (diffHour < 24) return t.hoursAgo(diffHour);
    if (diffDay < 30) return t.daysAgo(diffDay);
    if (diffMonth < 12) return t.monthsAgo(diffMonth);
    return t.yearsAgo(diffYear);
};
