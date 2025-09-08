// src/components/ProfileFab.jsx
export default function ProfileFab({  isOpen, onClick, onClose  }) { // FAB: Floating Action Button
  return (
    <button
  onClick={isOpen ? onClose : onClick}
  aria-label={isOpen ? "Close profile" : "Open profile"}
  className="fixed top-4 right-4 z-50 inline-flex items-center justify-center
             h-14 w-14 rounded-full bg-white/90 dark:bg-gray-800/80
             shadow-md ring-1 ring-black/5 hover:scale-105 transition"
>
  {isOpen ? (
    // ❌ 닫기 아이콘 (X)
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32" height="32" // 기존보다 큼
      fill="#ffffffff"
      viewBox="0 0 24 24"
    >
      <path d="M18.3 5.71a1 1 0 00-1.41 0L12 10.59 7.11 5.7a1 1 0 10-1.41 1.41L10.59 12l-4.89 4.89a1 1 0 101.41 1.41L12 13.41l4.89 4.89a1 1 0 001.41-1.41L13.41 12l4.89-4.89a1 1 0 000-1.4z"/>
    </svg>
  ) : (
    // 👤 프로필 아이콘
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32" height="32" // 기존보다 큼
      fill="#ffffffff"
      viewBox="0 0 24 24"
    >
      <path d="M12 12c2.7 0 5-2.5 5-5.5S14.7 1 12 1 7 3.5 7 6.5 9.3 12 12 12zm0 2c-4.4 0-8 2.7-8 6v2h16v-2c0-3.3-3.6-6-8-6z"/>
    </svg>
  )}
</button>

  );
}
